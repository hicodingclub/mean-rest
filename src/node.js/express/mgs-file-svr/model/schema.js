const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const fileSchema = new Schema({
  module: { type: String, index: true}, //link returned to the user
  name: { type: String, maxlength: 128},
  type: { type: String},
  labels: {type: [String]},
  md5: { type: String},
  size: { type: Number},
  link: { type: String}, //link returned to the user
  created: { type: Date, default: Date.now },
  data: { type: Buffer}
});

const fileLabelsSchema = new Schema({
  label: { type: String},
  created: { type: Date, default: Date.now },
});

module.exports = {
        fileSchema: fileSchema,
        fileLabelsSchema: fileLabelsSchema,
}