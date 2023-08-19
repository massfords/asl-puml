import { JSONPath } from "jsonpath-plus";
import { AslStatesNode, AslStateType, StateHints, StateName } from "./types";
import type { Config } from "./generated/config";
import { must } from "./must";

const compute_stereotype = (
  stateName: StateName,
  hints: StateHints,
  config: Config
): { stereotype: string; deadPath?: boolean } => {
  let idx = 0;
  for (const { pattern, deadPath } of config.theme.stateStyles ?? []) {
    const customPattern = new RegExp(pattern, "iu");
    if (customPattern.test(stateName)) {
      if (hints.json.Type === AslStateType.Choice) {
        return { stereotype: "<<Choice>>", deadPath: deadPath ?? false };
      }
      return {
        stereotype: `<<CustomStyle${idx}>>`,
        deadPath: deadPath ?? false,
      };
    }
    idx += 1;
  }

  if (hints.json.Type === AslStateType.Choice) {
    return { stereotype: "<<Choice>>" };
  }

  const compensatePattern = new RegExp(config.theme.compensation.pattern, "iu");
  if (compensatePattern.test(stateName)) {
    return { stereotype: "<<Compensate>>" };
  }

  if (hints.json.Type === AslStateType.Succeed && hints.parent !== null) {
    return { stereotype: "<<aslSucceedLocal>>" };
  }

  return { stereotype: `<<asl${hints.json.Type}>>` };
};

export const build_state_map = (
  definition: Record<string, unknown>,
  config: Config
): Map<StateName, StateHints> => {
  const state_map = new Map<StateName, StateHints>();
  let id = 1;

  const foundStates: AslStatesNode[] = JSONPath({
    json: definition,
    path: "$..States",
  });
  foundStates.forEach((states) => {
    Object.keys(states).forEach((stateName) => {
      const json = states[stateName];
      must(json, "failed to find state name", { stateName });
      const matchedStyle =
        config.theme.stateStyles?.find((style) => {
          const regex = new RegExp(style.pattern, "ui");
          return regex.test(stateName);
        }) ?? null;
      state_map.set(stateName, {
        parent: null,
        stereotype: null,
        id,
        json,
        description: matchedStyle?.description ?? null,
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
        path: `$..['States']['${key}'].[Iterator,ItemProcessor].States`,
      });
      child_states.forEach((states) => {
        Object.keys(states).forEach((stateName) => {
          const child_value = state_map.get(stateName);
          must(child_value, "failed to find state name", { stateName });
          child_value.parent = key;
          const { stereotype, deadPath } = compute_stereotype(
            stateName,
            child_value,
            config
          );
          child_value.stereotype = stereotype;
          child_value.deadPath = deadPath ?? false;
        });
      });
    }
    if (value.json.Type === "Parallel") {
      // update the child states
      const result:
        | Array<Record<string, unknown>>
        | Array<Record<string, unknown>>[] = JSONPath({
        json: definition,
        path: `$..['States']['${key}'].Branches`,
        wrap: false,
      });
      const branches = Array.isArray(result[0]) ? result[0] : result;
      branches.forEach((branch, index) => {
        const found_states: AslStatesNode[] = JSONPath({
          json: branch,
          path: "$.States",
        });
        found_states.forEach((states) => {
          Object.keys(states).forEach((stateName) => {
            const child_value = state_map.get(stateName);
            must(child_value, "failed to find state name", { stateName });
            child_value.parent = key;
            child_value.branch = index + 1;
          });
        });
      });
    }
  });

  state_map.forEach((hints, stateName) => {
    const { stereotype, deadPath } = compute_stereotype(
      stateName,
      hints,
      config
    );
    hints.deadPath = deadPath ?? false;
    hints.stereotype = stereotype;
  });

  return state_map;
};
