import type { AslDefinition, UserSpecifiedConfig } from "../lib/types";
import fs from "fs";
import path from "path";
import { asl_to_puml } from "../index";
import { aslValidator } from "../lib/validator";
import invariant from "tiny-invariant";
import { describe, expect } from "@jest/globals";

describe("unit tests for generating puml diagrams", () => {
  const loadDefinition = (name: string): AslDefinition => {
    const def: AslDefinition = JSON.parse(
      fs.readFileSync(path.join(__dirname, "definitions", name), "utf-8")
    ) as AslDefinition;
    aslValidator(def);
    return def;
  };

  const loadStyle = (name: string): UserSpecifiedConfig | null => {
    const dotAslJson = ".asl.json";
    const dotThemeJson = ".theme.json";
    invariant(name.endsWith(dotAslJson), "invalid test file name");
    const themeFileName = path.join(
      __dirname,
      "definitions",
      `${name.substring(0, name.length - dotAslJson.length)}${dotThemeJson}`
    );
    if (fs.existsSync(themeFileName)) {
      return JSON.parse(
        fs.readFileSync(themeFileName, "utf-8")
      ) as UserSpecifiedConfig;
    }
    return null;
  };

  describe("generate pumls", () => {
    const files = fs
      .readdirSync(path.join(__dirname, "definitions"))
      // .filter((file) => file.indexOf("demo.asl.json") >= 0)
      .filter((file) => file.endsWith(".asl.json"));

    const defaultStyleForTests: UserSpecifiedConfig = {
      theme: {
        comments: {
          "^.+$": {
            width: 30,
            side: "left",
          },
        },
      },
    };

    test.each(files)("%s", (filename) => {
      expect.hasAssertions();

      const definition = loadDefinition(filename);
      const style = loadStyle(filename) ?? defaultStyleForTests;
      const result = asl_to_puml(definition, style ?? defaultStyleForTests);
      if (!result.isValid) {
        // the generates are expected to work
        // this provides better insight into why it failed
        expect(result.message).toBeFalsy();
      }
      invariant(
        result.isValid,
        `Unexpected error message in result: ${JSON.stringify(result)}`
      );
      expect(result.isValid).toBe(true);
      const expected = fs.readFileSync(
        path.join(__dirname, "pumls", `${path.parse(filename).name}.puml`),
        "utf-8"
      );
      expect(result.puml).toStrictEqual(expected);
      // fs.writeFileSync(
      //   path.join(__dirname, "pumls", `${path.parse(filename).name}.puml`),
      //   result.puml
      // );
    });
  });
});
