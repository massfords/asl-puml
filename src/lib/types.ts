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
  Comment?: string | null;
}

export type AslStatesNode = Record<StateName, StateJsonNode>;

export type AslDefinition = Record<string, unknown> & {
  StartAt: StateName;
};

export interface AslChoiceTransitionNode {
  Next: StateName;
  StringEquals?: string;
}

export type Color = `#${string}`;
export interface StateConfig {
  BackgroundColor: Color;
  FontColor?: Color | "automatic";
}
export interface ContainerStateConfig {
  BackgroundColor: Color;
}
export interface LineConfig {
  bold?: true;
  color: Color;
}
export interface CompensationConfig {
  pattern: RegExp | string;
  color: Color;
}
export interface NoteConfig {
  width: number;
  side: "left" | "right";
}

export interface UserSpecifiedConfig {
  theme: {
    compensation?: CompensationConfig;
    compositeStates?: Record<string, string>;
    comments?: Record<string, NoteConfig>;
    lines?: {
      fromCatch?: LineConfig;
      toFail?: LineConfig;
    };
    skinparams?: {
      ArrowColor: Color;
    };
    states?: {
      Pass?: StateConfig;
      Task?: StateConfig;
      Choice?: StateConfig;
      Wait?: StateConfig;
      Succeed?: StateConfig;
      Fail?: StateConfig;
      Parallel?: ContainerStateConfig;
      Map?: ContainerStateConfig;
    };
  };
}

export interface Config {
  theme: {
    compensation: CompensationConfig;
    compositeStates: Record<string, string>;
    comments: Record<string, NoteConfig>;
    lines: {
      fromCatch: LineConfig;
      toFail: LineConfig;
    };
    skinparams: {
      ArrowColor: Color;
    };
    states: {
      Choice: StateConfig;
      Fail: StateConfig;
      Map: StateConfig;
      Parallel: StateConfig;
      Pass: StateConfig;
      Succeed: StateConfig;
      Task: StateConfig;
      Wait: StateConfig;
    };
  };
}

export const DefaultConfig: Config = {
  theme: {
    skinparams: {
      ArrowColor: "#black",
    },
    comments: {},
    compositeStates: {},
    states: {
      Pass: {
        BackgroundColor: "#whitesmoke",
      },
      Map: {
        BackgroundColor: "#whitesmoke",
      },
      Choice: {
        BackgroundColor: "#whitesmoke",
      },
      Parallel: {
        BackgroundColor: "#whitesmoke",
      },
      Wait: {
        BackgroundColor: "#whitesmoke",
      },
      Task: {
        BackgroundColor: "#lightblue",
      },
      Fail: {
        BackgroundColor: "#red",
      },
      Succeed: {
        BackgroundColor: "#green",
      },
    },
    lines: {
      fromCatch: {
        bold: true,
        color: "#orange",
      },
      toFail: {
        color: "#pink",
      },
    },
    compensation: {
      pattern: "^.*(compensate).*$",
      color: "#orange",
    },
  },
};

export type PumlBuilder = (
  definition: AslDefinition,
  state_map: Map<StateName, StateHints>,
  config: Config
) => string;
