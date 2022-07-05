import { AslDefinition, UserSpecifiedConfig } from "../lib/types";
import fs from "fs";
import path from "path";
import { asl_to_puml } from "../asl-puml";
import { must } from "../lib/assertions";
import { aslValidator } from "../lib/validator";

describe("unit tests for generating puml diagrams", () => {
  const loadDefinition = (name: string): AslDefinition => {
    const def: AslDefinition = JSON.parse(
      fs.readFileSync(path.join(__dirname, "definitions", name), "utf-8")
    ) as AslDefinition;
    aslValidator(def);
    return def;
  };

  describe("generate pumls", () => {
    const files = fs
      .readdirSync(path.join(__dirname, "definitions"))
      .filter((file) => file.endsWith(".asl.json"));

    const configByFileName = new Map<string, UserSpecifiedConfig>();
    configByFileName.set("demo.asl.json", {
      theme: {
        compositeStates: {
          "^Fulfill.+$": "Fulfilling",
        },
        comments: {
          "^.+$": {
            width: 30,
            side: "left",
          },
        },
      },
    });
    configByFileName.set("aws-example-dynamodb-semaphore.asl.json", {
      theme: {
        comments: {
          "Acquire Lock": {
            width: 30,
            side: "left",
          },
        },
      },
    });
    configByFileName.set("aws-example-execute_athena_query.asl.json", {
      theme: {
        comments: {},
      },
    });
    const defaultStyleForTests: UserSpecifiedConfig = {
      theme: {
        compositeStates: {
          "^Fulfill.+$": "Fulfilling",
        },
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
      const result = asl_to_puml(
        definition,
        configByFileName.get(filename) ?? defaultStyleForTests
      );
      if (!result.isValid) {
        // the generates are expected to work
        // this provides better insight into why it failed
        expect(result.message).toBeFalsy();
      }
      expect(result.isValid).toBe(true);
      must(result.isValid);
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
