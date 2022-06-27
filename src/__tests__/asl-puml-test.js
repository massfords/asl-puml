const fs = require('fs');
const path = require('path');
const aslValidator = require('asl-validator');
const asl_to_puml = require('../asl-puml');

describe('unit tests for generating puml diagrams', () => {
  const loadDefinition = (name) => {
    const def = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'definitions', name)),
    );
    const { isValid, errorsText } = aslValidator(def);
    if (!isValid) {
      throw Error(`test using invalid definition:${errorsText('\n')}`);
    }
    return def;
  };

  describe('generate puml tests', () => {
    const files = fs
      .readdirSync(path.join(__dirname, 'definitions'))
      .filter((file) => file.endsWith('.asl.json'));

    test.each(files)('%s', (filename) => {
      expect.hasAssertions();

      const definition = loadDefinition(filename);
      const result = asl_to_puml(definition);
      expect(result.isValid).toBe(true);
      fs.writeFileSync(
        path.join(__dirname, 'pumls', `${path.parse(filename).name}.puml`),
        Buffer.from(result.puml, 'utf-8'),
      );
    });
  });
});
