import { DefaultConfig, UserSpecifiedConfig } from "./types";
import Ajv from "ajv";
import config from "./config-schema.json";
import { Config } from "./generated/config";

const ajv: Ajv = new Ajv({ schemas: [config] });

export const toConfig = (
  configFromUsr?: UserSpecifiedConfig | null
): { isValid: true; config: Config } | { isValid: false; message: string } => {
  if (!configFromUsr) {
    return { isValid: true, config: DefaultConfig };
  }
  const config: Config = {
    theme: {
      wrapStateNamesAt: configFromUsr.theme.wrapStateNamesAt,
      compositeStates: configFromUsr.theme.compositeStates ?? {},
      comments: configFromUsr.theme.comments ?? {},
      skinparams: {
        ...DefaultConfig.theme.skinparams,
        ...configFromUsr.theme.skinparams,
      },
      compensation: {
        ...DefaultConfig.theme.compensation,
        ...configFromUsr.theme.compensation,
      },
      lines: {
        fromCatch: {
          ...DefaultConfig.theme.lines.fromCatch,
          ...configFromUsr.theme.lines?.fromCatch,
        },
        toFail: {
          ...DefaultConfig.theme.lines.toFail,
          ...configFromUsr.theme.lines?.toFail,
        },
      },
      states: {
        Choice: {
          ...DefaultConfig.theme.states.Choice,
          ...configFromUsr.theme.states?.Choice,
        },
        Fail: {
          ...DefaultConfig.theme.states.Fail,
          ...configFromUsr.theme.states?.Fail,
        },
        Map: {
          ...DefaultConfig.theme.states.Map,
          ...configFromUsr.theme.states?.Map,
        },
        Pass: {
          ...DefaultConfig.theme.states.Pass,
          ...configFromUsr.theme.states?.Pass,
        },
        Parallel: {
          ...DefaultConfig.theme.states.Parallel,
          ...configFromUsr.theme.states?.Parallel,
        },
        Succeed: {
          ...DefaultConfig.theme.states.Succeed,
          ...configFromUsr.theme.states?.Succeed,
        },
        Wait: {
          ...DefaultConfig.theme.states.Wait,
          ...configFromUsr.theme.states?.Wait,
        },
        Task: {
          ...DefaultConfig.theme.states.Task,
          ...configFromUsr.theme.states?.Task,
        },
      },
      stateStyles: configFromUsr.theme.stateStyles ?? [],
      excludeCatchComment: Boolean(configFromUsr.theme.excludeCatchComment),
    },
  };
  // see if the config is valid
  const configIsValid = ajv.validate(
    "https://github.com/massfords/asl-puml#",
    config
  );
  if (!configIsValid) {
    if (!ajv.errors) {
      return { isValid: false, message: "invalid config" };
    }
    const message = ajv.errors
      .map(
        (errobj) =>
          `${errobj.instancePath}:${errobj.keyword}:${errobj.message ?? ""}`
      )
      .join("\n");
    return { isValid: false, message: `invalid config: ${message}` };
  }

  return { isValid: true, config };
};
