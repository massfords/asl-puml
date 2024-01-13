import type { PumlBuilder, StateHints, StateName } from "./types";
import wordwrap from "word-wrap";
import type { Config } from "./generated/config";
import { must } from "./must";

export const decls: PumlBuilder = (_definition, state_map, config: Config) => {
  const truncate = (str: string, maxWidth: number): string => {
    if (str.length <= maxWidth) {
      return str;
    }
    const subString = str.substring(0, maxWidth - 1);
    return `${subString.substring(0, subString.lastIndexOf(" "))}...`;
  };

  const emit_decl = (
    stateName: StateName,
    hints: StateHints,
    accum: { lines: string[]; emitted: Set<StateName> }
  ) => {
    if (accum.emitted.has(stateName)) {
      return;
    }
    accum.emitted.add(stateName);
    const isContainer = ["Map", "Parallel"].indexOf(hints.json.Type) !== -1;
    const stateDecl = `state "${wordwrap(stateName, {
      indent: "",
      newline: "\\n",
      width: config.theme.wrapStateNamesAt ?? 30,
      trim: false,
    })}" as state${hints.id}${hints?.stereotype ?? ""}${
      // add the description to the state declaration if present and not a container.
      // puml doesn't support descriptions on composite states
      !isContainer && hints.description ? `: ${hints.description}` : ""
    }`;
    const brace = isContainer ? " {" : "";
    accum.lines.push(`${stateDecl}${brace}`);
    if (isContainer) {
      if ("Parallel" === hints.json.Type) {
        (hints.json.Branches || []).forEach((_, index) => {
          const branchNumber = index + 1;
          // add branch open
          accum.lines.push(
            `state "Branch ${branchNumber}" as state${hints.id}_${branchNumber} {`
          );
          state_map.forEach((vv, kk) => {
            if (vv.parent === stateName && vv.branch === branchNumber) {
              emit_decl(kk, vv, accum);
            }
          });
          // add branch close
          accum.lines.push("}");
        });
      } else {
        state_map.forEach((vv, kk) => {
          if (vv.parent === stateName) {
            emit_decl(kk, vv, accum);
          }
        });
      }
      accum.lines.push("}");
      if (hints?.description) {
        accum.lines.push(`note left of state${hints.id}`);
        accum.lines.push(`  ${hints.description}\n`);
        accum.lines.push(`end note`);
      }
    }

    // see if there's a note for the state
    // the theme contains a field for providing regular expressions to match against the
    // state names. If there's a comment and there's a matching config, then we'll render
    // the comment in the diagram
    const comment: string | null = hints.json.Comment ?? null;
    if (comment) {
      const noteConfig = Object.keys(config.theme.comments)
        .map((pattern) => {
          const firstPeriod = comment.indexOf(".");
          // find the first config that matches the state name
          return {
            pattern: new RegExp(pattern, "ui"),
            comment:
              // use the first sentence for the comment
              // or the whole comment if there's no period
              firstPeriod !== -1
                ? comment.substring(0, firstPeriod + 1)
                : comment,
            commentConfig: config.theme.comments[pattern],
          };
        })
        .find((entry) => entry.pattern.test(stateName));
      // if there's no config, then the comment isn't rendered
      if (noteConfig) {
        const { comment, commentConfig } = noteConfig;
        must(comment && commentConfig, "note config missing required fields", {
          comment,
          commentConfig,
        });
        accum.lines.push(`note ${commentConfig.side}`);
        accum.lines.push(
          wordwrap(truncate(comment, 512), {
            width: commentConfig.width,
            trim: true,
          })
            .split("\n")
            .map((s) => `  ${s}`)
            .join("\n")
        );
        accum.lines.push(`end note`);
      }
    }
  };

  // emit a state decl for each state found
  // for map and parallel states, nest the contained states w/in the parent
  // preserving the order of the states isn't required
  const accum: { lines: string[]; emitted: Set<StateName> } = {
    lines: [],
    emitted: new Set<StateName>(),
  };

  let compositeStatesCounter = 1;

  // emit the states that are logically grouped under a label
  const { compositeStates } = config.theme;
  Object.keys(compositeStates)
    .sort()
    .map((pattern) => {
      const regex = new RegExp(pattern, "iu");
      const matches: string[] = [];
      state_map.forEach((_value, key) => {
        if (accum.emitted.has(key)) {
          return;
        }
        if (regex.test(key)) {
          // this state matches a composite state regex
          // it should be grouped under the logical header
          matches.push(key);
        }
      });
      if (matches.length > 0) {
        // the logical header has matches, emit them
        const compositeStateLabel = compositeStates[pattern];
        must(compositeStateLabel, "missing state label", { pattern });
        accum.lines.push(
          `state "${compositeStateLabel}" as compositeState${compositeStatesCounter} ##[dashed] {`
        );
        compositeStatesCounter += 1;
        matches.forEach((key) => {
          const value = state_map.get(key);
          must(value, "failed to find state name", { stateName: key });
          emit_decl(key, value, accum);
        });
        accum.lines.push("}");
      }
    });

  const sorted = Array.from(state_map.keys()).sort((a, b) => {
    const stateA = state_map.get(a) as StateHints;
    const stateB = state_map.get(b) as StateHints;
    return stateA.id - stateB.id;
  });
  // emit containers first
  sorted
    .filter((key) => (state_map.get(key) as StateHints).parent === null)
    .forEach((key) => {
      emit_decl(key, state_map.get(key) as StateHints, accum);
    });
  sorted
    .filter((key) => (state_map.get(key) as StateHints).parent !== null)
    .forEach((key) => {
      emit_decl(key, state_map.get(key) as StateHints, accum);
    });
  return accum.lines.join("\n");
};
