import { AslDefinition } from "./lib/types";
// import { validator } from "./lib/asl-validator";
import { theme } from "./lib/theme";
import { decls } from "./lib/decls";
import { footer } from "./lib/footer";
import { build_state_map } from "./lib/build_state_map";
import { transitions } from "./lib/transitions";

export const asl_to_puml = (
  definition: AslDefinition
): { isValid: true; puml: string } | { isValid: false; message: string } => {
  // const { isValid, errorsText } = validator(definition);
  // if (!isValid) {
  //   return { isValid: false, message: errorsText("\n") };
  // }
  const state_map = build_state_map(definition);

  // we know the definition is valid at this point
  let puml = theme(definition, state_map);
  puml += decls(definition, state_map);
  puml += transitions(definition, state_map);
  puml += footer(definition, state_map);

  return { isValid: true, puml };
};
