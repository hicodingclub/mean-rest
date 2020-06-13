const schemas = {
    'download': {}, // only download fake schema is allowed
};
const config = {
}

const authz = {
  "module-authz": {"LoginUser": {"others": "R", "own": "R"}, "Anyone": "R"},
}
const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'FILE',
};
module.exports = {schemas, config, authz, DB_CONFIG}
