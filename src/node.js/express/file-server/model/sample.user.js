const schemas = {
    'download': {}, // only download fake schema is allowed
};
const config = {
}

const authz = {
  "module-authz": {"LoginUser": {"others": "R", "own": "R"}, "Anyone": "R"},
}

module.exports = {schemas, config, authz}
