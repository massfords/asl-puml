const { JSONPath } = require('jsonpath-plus');

module.exports = (definition, state_map) => {
  const catchTransitions = new Set();
  // start w/ some whitespace
  const lines = [''];
  const emit_transition_with_color = (srcHint, targetHint = null, extraHints = {}) => {
    const LHS = `state${srcHint.id}`;
    let transitionLine = null;
    let RHS = null;
    const label = (extraHints && extraHints.label) ? extraHints.label : '';
    if (targetHint && targetHint.json.Type === 'Fail') {
      RHS = `state${targetHint.id}`;
      transitionLine = '-[#pink]->';
    } else if (targetHint && extraHints.fromCatch) {
      RHS = `state${targetHint.id}`;
      transitionLine = '-[bold,#orange]->';
    } else if (targetHint && srcHint.json.Type === 'Choice') {
      RHS = `state${targetHint.id}`;
      transitionLine = '-->';
    } else if (targetHint) {
      RHS = `state${targetHint.id}`;
      transitionLine = '-->';
    } else if (!targetHint && srcHint.json.Type === 'Fail' && srcHint.parent === null) {
      RHS = '[*]';
      transitionLine = '-[#pink]->';
    } else if (!targetHint && srcHint.parent === null) {
      RHS = '[*]';
      transitionLine = '-->';
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
  lines.push(`[*] --> state${state_map.get(definition.StartAt).id}`);
  // emit transition for each state to its Next/Default
  state_map.forEach((hints) => {
    // if it's a choice, there can be multiple Next states plus a Default
    if (hints.json.Type === 'Choice') {
      JSONPath({ json: hints.json, path: '$..[*][?(@.Next)]' })
        .forEach((target) => {
          const targetHint = state_map.get(target.Next);
          let label = '';
          if (target.StringEquals) {
            label = `"${target.StringEquals}"`;
          }
          emit_transition_with_color(hints, targetHint, { label });
        });
      if (hints.json.Default) {
        const targetHint = state_map.get(hints.json.Default);
        emit_transition_with_color(hints, targetHint);
      }
    } else if (hints.json.Next) {
      const targetHint = state_map.get(hints.json.Next);
      emit_transition_with_color(hints, targetHint);
    } else {
      emit_transition_with_color(hints);
    }

    // check for Catch in a Task
    if (['Task', 'Parallel'].indexOf(hints.json.Type) !== -1 && hints.json.Catch) {
      // get the catch exit points
      hints.json.Catch.forEach((katch) => {
        const catchKey = `${hints.id}->${katch.Next}`;
        if (catchTransitions.has(catchKey)) {
          return;
        }
        catchTransitions.add(catchKey);
        const catchTargetHints = state_map.get(katch.Next);
        if (catchTargetHints.json.Type === 'Fail') {
          lines.push((`state${hints.id} -[#pink]-> state${catchTargetHints.id}`));
        } else {
          emit_transition_with_color(hints, catchTargetHints, { fromCatch: true });
        }
      });
    }
  });
  return lines.join('\n');
};
