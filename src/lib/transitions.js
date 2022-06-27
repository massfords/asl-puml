const { JSONPath } = require('jsonpath-plus');

module.exports = (definition, state_map) => {
  // start w/ some whitespace
  const lines = [''];
  // emit the head --> start with
  lines.push(`[*] --> state${state_map.get(definition.StartAt).id}`);
  // emit transition for each state to its Next/Default
  state_map.forEach((hints) => {
    // if it's a choice, there can be multiple Next states plus a Default
    if (hints.type === 'Choice') {
      JSONPath({ json: hints.json, path: '$..Next' })
        .forEach((target) => {
          const targetHint = state_map.get(target);
          lines.push((`state${hints.id} --> state${targetHint.id}`));
        });
      if (hints.json.Default) {
        const targetHint = state_map.get(hints.json.Default);
        lines.push((`state${hints.id} --> state${targetHint.id}`));
      }
    } else if (hints.json.Next) {
      const targetHint = state_map.get(hints.json.Next);
      lines.push((`state${hints.id} --> state${targetHint.id}`));
    } else if (hints.json.End && hints.parent === null) {
      lines.push((`state${hints.id} --> [*]`));
    } else if (hints.type === 'Succeed') {
      lines.push((`state${hints.id} --> [*]`));
    } else if (hints.type === 'Fail') {
      lines.push((`state${hints.id} -[bold,#red]-> [*]`));
    }

    // check for Catch in a Task
    if (['Task', 'Parallel'].indexOf(hints.type) !== -1 && hints.json.Catch) {
      // get the catch exit points
      hints.json.Catch.forEach((katch) => {
        lines.push((`state${hints.id} -[bold,#orange]-> state${state_map.get(katch.Next).id}`));
      });
    }
  });
  // emit transition for each state to global end
  return lines.join('\n');
};
