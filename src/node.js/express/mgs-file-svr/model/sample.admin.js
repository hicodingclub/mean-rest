const schema = require("./schema");

const fileSchema = schema.fileSchema;
var fB = "name type labels size link uploaded thumbnail";
var fD = "name type labels size link uploaded thumbnail";
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
        api: "LU"  //api exposed by rest controller
    },
    "mfilelabels": {
        schema: fileLabelsSchema,
        views: [lB, lD, lC, lE, lTS, lI],
        api: "L" //api exposed by rest controller
    },
    "upload": {},
    "download": {},
    "delete": {},
};
var config = {
  dateFormat: dateFormat,
  timeFormat: timeFormat,
}

const authz = {
        "module-authz": {"LoginUser": {"others": "", "own": ""}, "Anyone": ""},
        "download": {"LoginUser": {"others": "", "own": ""}, "Anyone": "R"},
}

module.exports = {schemas: schemas, config: config, authz: authz}
