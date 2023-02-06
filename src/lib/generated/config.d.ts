/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Color = string;

export interface Config {
  theme: Theme;
}
export interface Theme {
  compensation: CompensationConfig;
  wrapStateNamesAt?: number;
  compositeStates: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^.+$".
     */
    [k: string]: string;
  };
  excludeCatchComment?: boolean;
  comments: {
    [k: string]: NoteConfig;
  };
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
  stateStyles?: StateStyle[];
}
export interface CompensationConfig {
  pattern: string;
  color: Color;
}
/**
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^.+$".
 */
export interface NoteConfig {
  width: number;
  side: "left" | "right";
  [k: string]: unknown;
}
export interface LineConfig {
  bold?: true;
  color: Color;
}
export interface StateConfig {
  BackgroundColor: Color;
  FontColor?: Color | "automatic";
}
export interface StateStyle {
  pattern: string;
  color: Color;
}
