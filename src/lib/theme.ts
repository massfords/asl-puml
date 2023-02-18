import { AslStateType, PumlBuilder } from "./types";
import { JSONPath } from "jsonpath-plus";

export const theme: PumlBuilder = (definition, _state_map, config): string => {
  const emitStateStyle = (stateType: AslStateType): string => {
    switch (stateType) {
      case AslStateType.Choice:
        return `
    BackgroundColor<<Choice>> ${config.theme.states.Choice.BackgroundColor}
    FontColor<<Choice>> ${config.theme.states.Choice.FontColor ?? "automatic"}`;

      case AslStateType.Parallel:
      case AslStateType.Map:
        return `
    BackgroundColor<<asl${stateType}>> ${config.theme.states[stateType].BackgroundColor}`;
      case AslStateType.Fail:
      case AslStateType.Pass:
      case AslStateType.Succeed:
      case AslStateType.Wait:
      case AslStateType.Task:
        return `
    BackgroundColor<<asl${stateType}>> ${
          config.theme.states[stateType].BackgroundColor
        }
    FontColor<<asl${stateType}>> ${
          config.theme.states[stateType].FontColor ?? "automatic"
        }`;
      default: {
        const invalid: never = stateType;
        throw Error(`invalid state type: ${JSON.stringify(invalid)}`);
      }
    }
  };

  const all_used_states = new Set();
  const found: string[] = JSONPath({
    path: "$..States.*.Type",
    json: definition,
  });
  found.forEach((used_state) => all_used_states.add(used_state));

  const isStateTypeUsed = (stateType: AslStateType): boolean => {
    return all_used_states.has(stateType);
  };

  return `@startuml
hide empty description
skinparam ArrowColor ${config.theme.skinparams.ArrowColor}
skinparam state {
${[
  AslStateType.Choice,
  AslStateType.Fail,
  AslStateType.Map,
  AslStateType.Parallel,
  AslStateType.Pass,
  AslStateType.Succeed,
  AslStateType.Task,
  AslStateType.Wait,
]
  .filter((stateType) => isStateTypeUsed(stateType))
  .map((stateType) => emitStateStyle(stateType))
  .join("\n")}
    BackgroundColor<<Compensate>> ${config.theme.compensation.color}${(
    config.theme.stateStyles ?? []
  )
    .map(({ color, deadPath }, index) => {
      return `
    FontColor<<CustomStyle${index}>> ${deadPath ? "gray" : "automatic"}
    BackgroundColor<<CustomStyle${index}>> ${color}`;
    })
    .join("")}
}
`;
};
