const schema = require("./schema");

const fileSchema = schema.fileSchema;
var fB = "name type labels link";
var fD = "name type labels link";
var fC = "name labels";
var fE = "name labels";
var fTS = "name labels";  //fields that can make text search on.
var fI = "name";

const fileLabelsSchema = schema.fileLabelsSchema
  
var lB = "label";
var lD = "label created";
var lC = "label";
var lE = "label";
var lTS = "";  //fields that can make text search on.
var lI = "label";



var dateFormat = "MM/DD/YYYY";
var timeFormat = "hh:mm:ss";

var schemas = {
    "mfile": {
        schema: fileSchema,
        views: [fB, fD, fC, fE, fTS, fI],
        api: "L"
    },
};
var config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = {
  "module-authz": {"LoginUser": {"others": "R", "own": "R"}, "Anyone": "R"},
}

const options = {
  "upload": false,
  "backend": "db",
  "download": true,
  "download-url-path": "/uploads"
};

module.exports = {schemas: schemas, config: config, authz: authz, options: options}
