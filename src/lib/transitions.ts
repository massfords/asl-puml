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
  const emit_transition_with_color = (args: {
    srcHint: StateHints;
    targetHint?: StateHints | null;
    extraHints?: { label?: string; fromCatch?: true };
  }) => {
    const { srcHint, targetHint, extraHints } = args;
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
      lines.push(`${LHS} ${transitionLine} ${RHS}`);
      if (label) {
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
        if (target.StringEquals) {
          label = `"${target.StringEquals}"`;
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
      ["Task", "Parallel"].indexOf(hints.json.Type) !== -1 &&
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
        if (catchTargetHints.json.Type === "Fail") {
          lines.push(
            `state${hints.id} ${lineFromStyle(
              config.theme.lines.toFail
            )} state${catchTargetHints.id}`
          );
        } else {
          emit_transition_with_color({
            srcHint: hints,
            targetHint: catchTargetHints,
            extraHints: {
              fromCatch: true,
            },
          });
        }
      });
    }
  });
  return lines.join("\n");
};
