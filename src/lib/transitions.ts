import { JSONPath } from "jsonpath-plus";
import { AslChoiceTransitionNode, PumlBuilder, StateHints } from "./types";
import { LineConfig } from "./generated/config";
import invariant from "tiny-invariant";

export const transitions: PumlBuilder = (definition, state_map, config) => {
  const catchTransitions = new Set();
  // start w/ some whitespace
  const lines = [""];
  const lineFromStyle = (lineConfig: LineConfig): string => {
    return `-[${lineConfig.bold ? "bold," : ""}${lineConfig.color}]->`;
  };
  const deadpathStyle = config.theme.lines.deadPath ?? { color: "#lightgray" };
  const emit_transition_with_color = (args: {
    srcHint: StateHints;
    targetHint?: StateHints | null;
    extraHints?: { label?: string | null; fromCatch?: true };
  }) => {
    const { srcHint, targetHint, extraHints } = args;
    // if non-null, the deadpathLine will be used instead of
    // the transitionLine variable that's set along with the
    // RHS. We set both in that logic but will ignore the
    // transitionLine
    const deadpathLine: string | null =
      srcHint.deadPath || targetHint?.deadPath
        ? lineFromStyle(deadpathStyle)
        : null;
    const LHS = `state${srcHint.id}`;
    let transitionLine = null;
    let RHS = null;
    const label = extraHints && extraHints.label ? extraHints.label : "";
    if (targetHint && targetHint.json.Type === "Fail") {
      RHS = `state${targetHint.id}`;
      transitionLine = lineFromStyle(config.theme.lines.toFail);
    } else if (targetHint && extraHints?.fromCatch) {
      RHS = `state${targetHint.id}`;
      transitionLine = lineFromStyle(config.theme.lines.fromCatch);
    } else if (targetHint && srcHint.json.Type === "Choice") {
      RHS = `state${targetHint.id}`;
      transitionLine = "-->";
    } else if (targetHint) {
      RHS = `state${targetHint.id}`;
      transitionLine = "-->";
    } else if (
      !targetHint &&
      srcHint.json.Type === "Fail" &&
      srcHint.parent === null
    ) {
      RHS = "[*]";
      transitionLine = lineFromStyle(config.theme.lines.toFail);
    } else if (!targetHint && srcHint.parent === null) {
      RHS = "[*]";
      transitionLine = "-->";
    }
    if (transitionLine && RHS) {
      lines.push(`${LHS} ${deadpathLine ?? transitionLine} ${RHS}`);
      if (label && !deadpathLine) {
        lines.push(`note on link
${label}
end note`);
      }
    }
  };
  // emit the head --> start with
  const head = state_map.get(definition.StartAt);
  invariant(head);
  lines.push(`[*] --> state${head.id}`);
  // emit transition for each state to its Next/Default
  state_map.forEach((hints) => {
    // if it's a choice, there can be multiple Next states plus a Default
    if (hints.json.Type === "Choice") {
      const transitionNodes: AslChoiceTransitionNode[] = JSONPath({
        json: hints.json,
        path: "$..[*][?(@.Next)]",
      });
      transitionNodes.forEach((target) => {
        const targetHint = state_map.get(target.Next);
        invariant(targetHint);
        let label = "";
        if (target.Comment) {
          label = target.Comment;
        } else if (target.StringEquals) {
          label = target.StringEquals;
        }
        emit_transition_with_color({
          srcHint: hints,
          targetHint,
          extraHints: {
            label,
          },
        });
      });
      if (hints.json.Default) {
        const targetHint = state_map.get(hints.json.Default);
        invariant(targetHint);
        emit_transition_with_color({ srcHint: hints, targetHint });
      }
    } else if (hints.json.Next) {
      const targetHint = state_map.get(hints.json.Next);
      invariant(targetHint);
      emit_transition_with_color({ srcHint: hints, targetHint });
    } else {
      emit_transition_with_color({ srcHint: hints });
    }

    // check for Catch in a Task
    if (
      ["Task", "Parallel", "Map"].indexOf(hints.json.Type) !== -1 &&
      hints.json.Catch
    ) {
      // get the catch exit points
      hints.json.Catch.forEach((katch) => {
        const catchKey = `${hints.id}->${katch.Next}`;
        if (catchTransitions.has(catchKey)) {
          return;
        }
        catchTransitions.add(catchKey);
        const catchTargetHints = state_map.get(katch.Next);
        invariant(catchTargetHints);
        emit_transition_with_color({
          srcHint: hints,
          targetHint: catchTargetHints,
          extraHints: {
            label: config.theme.excludeCatchComment
              ? null
              : katch.Comment ?? null,
            fromCatch: true,
          },
        });
      });
    }
  });
  return lines.join("\n");
};
