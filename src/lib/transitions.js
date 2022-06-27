const { JSONPath } = require('jsonpath-plus');

module.exports = (definition, state_map) => {
  const catchTransitions = new Set();
  // start w/ some whitespace
  const lines = [''];
  const emit_transition_with_color = (srcHint, targetHint = null, fromCatch = false) => {
    if (targetHint && targetHint.json.Type === 'Fail') {
      lines.push((`state${srcHint.id} -[#pink]-> state${targetHint.id}`));
    } else if (targetHint && fromCatch) {
      lines.push((`state${srcHint.id} -[bold,#orange]-> state${targetHint.id}`));
    } else if (targetHint) {
      lines.push((`state${srcHint.id} --> state${targetHint.id}`));
    } else if (!targetHint && srcHint.json.Type === 'Fail' && srcHint.parent === null) {
      lines.push((`state${srcHint.id} -[#pink]-> [*]`));
    } else if (!targetHint && srcHint.parent === null) {
      lines.push((`state${srcHint.id} --> [*]`));
    }
  };
  // emit the head --> start with
  lines.push(`[*] --> state${state_map.get(definition.StartAt).id}`);
  // emit transition for each state to its Next/Default
  state_map.forEach((hints) => {
    // if it's a choice, there can be multiple Next states plus a Default
    if (hints.json.Type === 'Choice') {
      JSONPath({ json: hints.json, path: '$..Next' })
        .forEach((target) => {
          const targetHint = state_map.get(target);
          emit_transition_with_color(hints, targetHint);
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
          lines.push((`state${hints.id} -[bold,#orange]-> state${catchTargetHints.id}`));
        }
      });
    }
  });
  // emit transition for each state to global end
  return lines.join('\n');
};
