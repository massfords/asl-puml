const fs = require("fs");
const path = require("path");
const build_state_map = require("../lib/build_state_map");
const decls = require("../lib/decls");
const asl_to_puml = require("../asl-puml");
const aslValidator = require("asl-validator");

describe("unit tests for generating puml diagrams", () => {
  describe("build_state_map", () => {
    test("single state", () => {
      const definition = loadDefinition("succeed.json");
      const state_map = build_state_map(definition);
      expect(state_map.size).toStrictEqual(1);
      expect(state_map.get("Hello")).toMatchInlineSnapshot(`
        Object {
          "id": 1,
          "parent": null,
          "type": "Succeed",
        }
      `);
    });
    test("map states", () => {
      const definition = loadDefinition("map.json");
      const state_map = build_state_map(definition);
      expect(state_map.size).toStrictEqual(3);
      expect(state_map.get("Map")).toMatchInlineSnapshot(`
        Object {
          "id": 1,
          "parent": null,
          "type": "Map",
        }
      `);
      expect(state_map.get("Final State")).toMatchInlineSnapshot(`
        Object {
          "id": 2,
          "parent": null,
          "type": "Pass",
        }
      `);
      expect(state_map.get("Wait 20s")).toMatchInlineSnapshot(`
        Object {
          "id": 3,
          "parent": "Map",
          "type": "Wait",
        }
      `);
    });
  });
  describe("decls", () => {
    test("smallest example", () => {
      expect.hasAssertions();
      const definition = loadDefinition("succeed.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toStrictEqual('state "Hello" as state1');
    });
    test("example with map state", () => {
      expect.hasAssertions();
      const definition = loadDefinition("map.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toMatchInlineSnapshot(`
        "state \\"Map\\" as state1 {
        state \\"Wait 20s\\" as state3
        }
        state \\"Final State\\" as state2"
      `);
    });
    test("example with nested map state", () => {
      expect.hasAssertions();
      const definition = loadDefinition("nested_maps.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toMatchInlineSnapshot(`
        "state \\"Map\\" as state1 {
        state \\"Map2\\" as state3 {
        state \\"Wait 20s\\" as state4
        }
        }
        state \\"Final State\\" as state2"
      `);
    });
    test.todo("example with parallel state");
  });

  describe("generate puml tests", () => {
    test.each(["map", "nested_maps", "parallel", "succeed"])("%s", (name) => {
      expect.hasAssertions();

      const definition = loadDefinition(`${name}.json`);
      const result = asl_to_puml(definition);
      expect(result.isValid).toBe(true);
      fs.writeFileSync(
        path.join(__dirname, "pumls", `${name}.puml`),
        Buffer.from(result.puml, "utf-8")
      );
    });
  });
  const loadDefinition = (name) => {
    const def = JSON.parse(
      fs.readFileSync(path.join(__dirname, "definitions", name))
    );
    const { isValid, errorsText } = aslValidator(def);
    if (!isValid) {
      throw Error("test using invalid definition:" + errorsText("\n"));
    }
    return def;
  };
});
