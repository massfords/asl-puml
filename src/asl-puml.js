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
    let puml = theme(definition, state_map);
    puml += decls(definition, state_map);
    puml += transitions(definition, state_map);
    puml += footer(definition, state_map);

    return {isValid: true, puml};
}

module.exports = asl_to_puml;