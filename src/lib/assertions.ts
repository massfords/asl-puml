import { StateHints } from "./types";

export type Must = <T>(nullable?: T) => asserts nullable;
export const must: Must = <T>(nullable?: T): asserts nullable => {
  if (!nullable) {
    throw Error("T must be truthy");
  }
};

export type AssertStateHints = (
  stateHints?: StateHints | null
) => asserts stateHints;
export const assertStateHints: AssertStateHints = (
  stateHints: StateHints | null | undefined
): asserts stateHints => {
  if (!stateHints) {
    throw Error(`state not found`);
  }
};
