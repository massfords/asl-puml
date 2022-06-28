import { AslDefinition } from "../lib/types";
import fs from "fs";
import path from "path";
import { asl_to_puml } from "../asl-puml";
import { must } from "../lib/assertions";

describe("unit tests for generating puml diagrams", () => {
  const loadDefinition = (name: string): AslDefinition => {
    // noinspection UnnecessaryLocalVariableJS
    const def: AslDefinition = JSON.parse(
      fs.readFileSync(path.join(__dirname, "definitions", name), "utf-8")
    ) as AslDefinition;
    // const { isValid, errorsText } = validator(def);
    // if (!isValid) {
    //   throw Error(`test using invalid definition:${errorsText('\n')}`);
    // }
    return def;
  };

  describe("generate puml tests", () => {
    const files = fs
      .readdirSync(path.join(__dirname, "definitions"))
      .filter((file) => file.endsWith(".asl.json"));

    test.each(files)("%s", (filename) => {
      expect.hasAssertions();

      const definition = loadDefinition(filename);
      const result = asl_to_puml(definition);
      expect(result.isValid).toBe(true);
      must(result.isValid);
      const expected = fs.readFileSync(
        path.join(__dirname, "pumls", `${path.parse(filename).name}.puml`),
        "utf-8"
      );
      expect(result.puml).toStrictEqual(expected);
    });
  });
});