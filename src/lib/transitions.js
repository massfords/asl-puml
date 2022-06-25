const jp = require('jsonpath');

module.exports = (definition, state_map) => {
    // start w/ some whitespace
    const lines = [""];
    // emit the head --> start with
    lines.push(`[*] --> state${state_map.get(definition.StartAt).id}`)
    // emit transition for each state to its Next/Default
    state_map.forEach((hints) => {
        // if it's a choice, there can be multiple Next states plus a Default
        if (hints.type === 'Choice') {
            jp.query(definition, `$..[\'Next\', \'Default\']`)
                .forEach((targets) => {
                    targets.forEach((target) => {
                        lines.push((`state${hints.id} --> state${state_map.get(target).id}`));
                    })
                });

        } else if (hints.json.Next) {
            lines.push((`state${hints.id} --> state${state_map.get(hints.json.Next).id}`));
        } else if (hints.json.End && hints.parent === null) {
            lines.push((`state${hints.id} --> [*]`));
        } else if (['Succeed', 'Fail'].indexOf(hints.type) !== -1) {
            lines.push((`state${hints.id} --> [*]`));
        }
    });
    // emit transition for each state to global end
    return lines.join("\n");
}