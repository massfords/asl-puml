const jp = require('jsonpath');

const build_state_map = (definition) => {
  const state_map = new Map();
  let id = 1;
  jp.query(definition, '$..[\'States\']')
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
      jp.query(definition, `$..['States']['${key}'].Iterator.States`)
        .forEach((states) => {
          Object.keys(states).forEach((stateName) => {
            const child_value = state_map.get(stateName);
            child_value.parent = key;
          });
        });
    }
    if (value.type === 'Parallel') {
      // update the child states
      const [branches] = jp.query(definition, `$..['States']['${key}'].Branches`);
      branches.forEach((branch) => {
        jp.query(branch, '$.States')
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
