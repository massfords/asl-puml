const fs = require("fs");
const path = require("path");
const build_state_map = require("../lib/build_state_map");
const decls = require("../lib/decls");
const asl_to_puml = require("../asl-puml");
const aslValidator = require("asl-validator");

describe("unit tests for generating puml diagrams", () => {
  describe("build_state_map", () => {
    test("single state", () => {
      const definition = loadDefinition("succeed.asl.json");
      const state_map = build_state_map(definition);
      expect(state_map.size).toStrictEqual(1);
      expect(fetchAndPrune("Hello", state_map)).toMatchInlineSnapshot(`
        Object {
          "id": 1,
          "parent": null,
          "type": "Succeed",
        }
      `);
    });
    test("map states", () => {
      const definition = loadDefinition("map.asl.json");
      const state_map = build_state_map(definition);
      expect(state_map.size).toStrictEqual(3);
      expect(fetchAndPrune("Map", state_map)).toMatchInlineSnapshot(`
        Object {
          "id": 1,
          "parent": null,
          "type": "Map",
        }
      `);
      expect(fetchAndPrune("Final State", state_map)).toMatchInlineSnapshot(`
        Object {
          "id": 2,
          "parent": null,
          "type": "Succeed",
        }
      `);
      expect(fetchAndPrune("Wait 20s", state_map)).toMatchInlineSnapshot(`
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
      const definition = loadDefinition("succeed.asl.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toStrictEqual('state "Hello" as state1<<aslSucceed>>');
    });
    test("example with map state", () => {
      expect.hasAssertions();
      const definition = loadDefinition("map.asl.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toMatchInlineSnapshot(`
        "state \\"Map\\" as state1<<aslMap>> {
        state \\"Wait 20s\\" as state3<<aslWait>>
        }
        state \\"Final State\\" as state2<<aslSucceed>>"
      `);
    });
    test("example with nested map state", () => {
      expect.hasAssertions();
      const definition = loadDefinition("nested_maps.asl.json");
      const state_map = build_state_map(definition);
      const puml = decls(definition, state_map);
      expect(puml).toMatchInlineSnapshot(`
        "state \\"Map\\" as state1<<aslMap>> {
        state \\"Map2\\" as state3<<aslMap>> {
        state \\"Wait 20s\\" as state4<<aslWait>>
        }
        }
        state \\"Final State\\" as state2<<aslSucceed>>"
      `);
    });
    test.todo("example with parallel state");
  });

  describe("generate puml tests", () => {
    const files = fs.readdirSync(path.join(__dirname, 'definitions')).filter((file) => file.endsWith(".asl.json"));

    test.each(files)(
      "%s",
      (filename) => {
        expect.hasAssertions();

        const definition = loadDefinition(filename);
        const result = asl_to_puml(definition);
        expect(result.isValid).toBe(true);
        fs.writeFileSync(
          path.join(__dirname, "pumls", `${path.parse(filename).name}.puml`),
          Buffer.from(result.puml, "utf-8")
        );
      }
    );
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

  const fetchAndPrune = (stateName, map) => {
    const { json, ...pruned } = map.get(stateName);
    return pruned;
  };
});
