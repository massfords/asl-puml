module.exports = (definition, state_map) => {
  const emit_decl = (stateName, hints, accum) => {
    if (accum.emitted.has(stateName)) {
      return;
    }
    accum.emitted.add(stateName);
    const isContainer = ['Map', 'Parallel'].indexOf(hints.type) !== -1;
    if (isContainer) {
      accum.lines.push(`state "${stateName}" as state${hints.id}<<asl${hints.type}>> {`);
      // print this state's children
      state_map.forEach((vv, kk) => {
        if (vv.parent === stateName) {
          emit_decl(kk, vv, accum);
        }
      });
      accum.lines.push('}');
    } else {
      accum.lines.push(`state "${stateName}" as state${hints.id}<<asl${hints.type}>>`);
    }
  };

  // emit a state decl for each state found
  // for map and parallel states, nest the contained states w/in the parent
  // preserving the order of the states isn't required
  const accum = { lines: [], emitted: new Set() };
  state_map.forEach((value, key) => {
    emit_decl(key, value, accum);
  });
  return accum.lines.join('\n');
};
