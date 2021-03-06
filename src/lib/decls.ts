import { Config, PumlBuilder, StateHints, StateName } from "./types";
import { must } from "./assertions";
import wordwrap from "word-wrap";

export const decls: PumlBuilder = (definition, state_map, config: Config) => {
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
    const stateDecl = `state "${stateName}" as state${hints.id}${
      hints?.stereotype ?? ""
    }`;
    const isContainer = ["Map", "Parallel"].indexOf(hints.json.Type) !== -1;
    const brace = isContainer ? " {" : "";
    accum.lines.push(`${stateDecl}${brace}`);
    if (isContainer) {
      state_map.forEach((vv, kk) => {
        if (vv.parent === stateName) {
          emit_decl(kk, vv, accum);
        }
      });
      accum.lines.push("}");
    }

    // see if there's a note for the state
    const comment: string | null = hints.json.Comment ?? null;
    if (comment) {
      const noteConfigs = Object.keys(config.theme.comments)
        .map((pattern) => {
          const firstPeriod = comment.indexOf(".");
          return {
            pattern: new RegExp(pattern, "ui"),
            comment:
              firstPeriod !== -1
                ? comment.substring(0, firstPeriod + 1)
                : comment,
            commentConfig: config.theme.comments[pattern],
          };
        })
        .filter((entry) => entry.pattern.test(stateName));
      if (noteConfigs.length > 0) {
        const { comment, commentConfig } = noteConfigs[0];
        accum.lines.push(`note ${commentConfig.side}`);
        accum.lines.push(
          wordwrap(truncate(comment, 512), {
            width: commentConfig.width,
            trim: true,
          })
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
  Object.keys(compositeStates).map((pattern) => {
    const regex = new RegExp(pattern, "iu");
    const matches: string[] = [];
    state_map.forEach((value, key) => {
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
      accum.lines.push(
        `state "${compositeStateLabel}" as compositeState${compositeStatesCounter} ##[dashed] {`
      );
      compositeStatesCounter += 1;
      matches.forEach((key) => {
        const value = state_map.get(key);
        must(value);
        emit_decl(key, value, accum);
      });
      accum.lines.push("}");
    }
  });

  state_map.forEach((value, key) => {
    emit_decl(key, value, accum);
  });
  return accum.lines.join("\n");
};
