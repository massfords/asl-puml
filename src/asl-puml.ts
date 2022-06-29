import { AslDefinition } from "./lib/types";
import { theme } from "./lib/theme";
import { decls } from "./lib/decls";
import { footer } from "./lib/footer";
import { build_state_map } from "./lib/build_state_map";
import { transitions } from "./lib/transitions";
import { aslValidator } from "./lib/validator";

export const asl_to_puml = (
  definition: AslDefinition
): { isValid: true; puml: string } | { isValid: false; message: string } => {
  aslValidator(definition);
  const state_map = build_state_map(definition);

  // we know the definition is valid at this point
  let puml = theme(definition, state_map);
  puml += decls(definition, state_map);
  puml += transitions(definition, state_map);
  puml += footer(definition, state_map);

  return { isValid: true, puml };
};
