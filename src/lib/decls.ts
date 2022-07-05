import { Config, PumlBuilder, StateHints, StateName } from "./types";
import { must } from "./assertions";

export const decls: PumlBuilder = (definition, state_map, config: Config) => {
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
  };

  // emit a state decl for each state found
  // for map and parallel states, nest the contained states w/in the parent
  // preserving the order of the states isn't required
  const accum: { lines: string[]; emitted: Set<StateName> } = {
    lines: [],
    emitted: new Set<StateName>(),
  };

  const compositeStatesCounter = 1;

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
