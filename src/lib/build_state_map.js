const { JSONPath } = require('jsonpath-plus');

const build_state_map = (definition) => {
  const state_map = new Map();
  let id = 1;

  const compute_stereotype = (stateName, hints) => {
    if (hints.json.Type === 'Choice') {
      return '<<Choice>>';
    }
    // todo - move this to a config
    const compensatePattern = /compensate/iu;
    if (compensatePattern.test(stateName)) {
      return '<<Compensate>>';
    }

    if (hints.json.Type === 'Succeed' && hints.parent !== null) {
      return '<<aslSucceedLocal>>';
    }
    return `<<asl${hints.json.Type}>>`;
  };

  JSONPath({ json: definition, path: '$..States' })
    .forEach((states) => {
      Object.keys(states).forEach((stateName) => {
        state_map.set(stateName, {
          parent: null,
          stereotype: null,
          id,
          json: states[stateName],
        });
        id += 1;
      });
    });
  // set parents on all states nested within a Map or Parallel state
  state_map.forEach((value, key) => {
    if (value.json.Type === 'Map') {
      // update the child states
      JSONPath({ json: definition, path: `$..['States']['${key}'].Iterator.States` })
        .forEach((states) => {
          Object.keys(states).forEach((stateName) => {
            const child_value = state_map.get(stateName);
            child_value.parent = key;
            child_value.stereotype = compute_stereotype(stateName, child_value);
          });
        });
    }
    if (value.json.Type === 'Parallel') {
      // update the child states
      const [branches] = JSONPath({ json: definition, path: `$..['States']['${key}'].Branches` });
      branches.forEach((branch) => {
        JSONPath({ json: branch, path: '$.States' })
          .forEach((states) => {
            Object.keys(states).forEach((stateName) => {
              const child_value = state_map.get(stateName);
              child_value.parent = key;
            });
          });
      });
    }
  });

  state_map.forEach((hints, stateName) => {
    hints.stereotype = compute_stereotype(stateName, hints);
  });

  return state_map;
};

module.exports = build_state_map;
