const aslValidator = require('asl-validator');
const theme = require("./lib/theme")
const decls = require("./lib/decls")
const footer = require("./lib/footer")
const build_state_map = require("./lib/build_state_map")
const transitions = require("./lib/transitions");

const asl_to_puml = (definition) => {
    const { isValid, errorsText } = aslValidator(definition);
    if (!isValid) {
        return {isValid: false, message: errorsText('\n') };
    }
    const state_map = build_state_map(definition);

    // we know the definition is valid at this point
    // in order to generate a diagram, we need the following:
    // - some basic styling
    let puml = theme(definition, state_map);
    // - state declarations
    puml += decls(definition, state_map);
    // - state transitions
    puml += transitions(definition, state_map);
    // - artificial grouping by regex for layout purposes
    // - state rendering by type with color
    // - state rendering by type with icon
    // - transition from catch to non-fatal state as warn style (orange)
    // - transition to fatal state as error style (red)
    // - transition to end state as done style (green)
    puml += footer(definition, state_map);

    return {isValid: true, puml};
}

module.exports = asl_to_puml;