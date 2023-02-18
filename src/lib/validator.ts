import type { AslDefinition } from "./types";

export type ValidatorFunction = (definition: AslDefinition) => {
  isValid: boolean;
  errorsText: (sep: string) => string;
};

const validator: ValidatorFunction =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("asl-validator") as ValidatorFunction;

export type ASLValidator = (definition: AslDefinition) => asserts definition;
export const aslValidator: ASLValidator = (
  definition: AslDefinition
): asserts definition => {
  const result = validator(definition);
  if (!result.isValid) {
    throw Error(`definition is invalid:${result.errorsText("\n")}`);
  }
};
