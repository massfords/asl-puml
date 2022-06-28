import { PumlBuilder, StateHints, StateName } from "./types";

export const decls: PumlBuilder = (definition, state_map) => {
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
  const accum = { lines: [], emitted: new Set<StateName>() };
  state_map.forEach((value, key) => {
    emit_decl(key, value, accum);
  });
  return accum.lines.join("\n");
};
