import { JSONPath } from "jsonpath-plus";
import { AslStatesNode, AslStateType, StateHints, StateName } from "./types";

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

const compute_stereotype = (stateName: StateName, hints: StateHints) => {
  if (hints.json.Type === AslStateType.Choice) {
    return "<<Choice>>";
  }
  // todo - move this to a config
  const compensatePattern = /compensate/iu;
  if (compensatePattern.test(stateName)) {
    return "<<Compensate>>";
  }

  if (hints.json.Type === AslStateType.Succeed && hints.parent !== null) {
    return "<<aslSucceedLocal>>";
  }
  return `<<asl${hints.json.Type}>>`;
};

export const build_state_map = (
  definition: Record<string, unknown>
): Map<StateName, StateHints> => {
  const state_map = new Map<StateName, StateHints>();
  let id = 1;

  const foundStates: AslStatesNode[] = JSONPath({
    json: definition,
    path: "$..States",
  });
  foundStates.forEach((states) => {
    Object.keys(states).forEach((stateName) => {
      state_map.set(stateName, {
        parent: null,
        stereotype: null,
        id,
        json: states[stateName],
      });
      id += 1;
    });
  });
  // set parents on all states nested within a Map or Parallel state
  state_map.forEach((value, key) => {
    if (value.json.Type === "Map") {
      // update the child states
      const child_states: AslStatesNode[] = JSONPath({
        json: definition,
        path: `$..['States']['${key}'].Iterator.States`,
      });
      child_states.forEach((states) => {
        Object.keys(states).forEach((stateName) => {
          const child_value = state_map.get(stateName);
          assertStateHints(child_value);
          child_value.parent = key;
          child_value.stereotype = compute_stereotype(stateName, child_value);
        });
      });
    }
    if (value.json.Type === "Parallel") {
      // update the child states
      const branches: Array<Record<string, unknown>> = JSONPath({
        json: definition,
        path: `$..['States']['${key}'].Branches`,
        wrap: false,
      });
      branches.forEach((branch) => {
        const found_states: AslStatesNode[] = JSONPath({
          json: branch,
          path: "$.States",
        });
        found_states.forEach((states) => {
          Object.keys(states).forEach((stateName) => {
            const child_value = state_map.get(stateName);
            assertStateHints(child_value);
            child_value.parent = key;
          });
        });
      });
    }
  });

  state_map.forEach((hints, stateName) => {
    hints.stereotype = compute_stereotype(stateName, hints);
  });

  return state_map;
};
