export interface StateHints {
  parent: string | null;
  stereotype: string | null;
  id: number;
  json: StateJsonNode;
}

export type StateName = string;

export enum AslStateType {
  Task = "Task",
  Parallel = "Parallel",
  Map = "Map",
  Pass = "Pass",
  Wait = "Wait",
  Choice = "Choice",
  Succeed = "Succeed",
  Fail = "Fail",
}

export interface StateJsonNode {
  Type: AslStateType;
  End?: true;
  Default?: string;
  Next?: string;
  Catch?: Array<{ Next: string }>;
}

export type AslStatesNode = Record<StateName, StateJsonNode>;

export type AslDefinition = Record<string, unknown> & {
  StartAt: StateName;
};

export interface AslChoiceTransitionNode {
  Next: StateName;
  StringEquals?: string;
}

export type PumlBuilder = (
  definition: AslDefinition,
  state_map: Map<StateName, StateHints>
) => string;
