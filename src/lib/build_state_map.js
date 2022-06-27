const { JSONPath } = require('jsonpath-plus');

const build_state_map = (definition) => {
  const state_map = new Map();
  let id = 1;
  JSONPath({ json: definition, path: '$..States' })
    .forEach((states) => {
      Object.keys(states).forEach((stateName) => {
        state_map.set(stateName, {
          parent: null, type: states[stateName].Type, id, json: states[stateName],
        });
        id += 1;
      });
    });
  // set parents on all states nested within a Map or Parallel state
  state_map.forEach((value, key) => {
    if (value.type === 'Map') {
      // update the child states
      JSONPath({ json: definition, path: `$..['States']['${key}'].Iterator.States` })
        .forEach((states) => {
          Object.keys(states).forEach((stateName) => {
            const child_value = state_map.get(stateName);
            child_value.parent = key;
          });
        });
    }
    if (value.type === 'Parallel') {
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

  return state_map;
};

module.exports = build_state_map;
