const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  name: { type: String, maxlength: 128},
  type: { type: String},
  labels: {type: [String]},
  md5: { type: String},
  size: { type: Number},
  link: { type: String}, //download link
  uploaded: { type: Date, default: Date.now },
  data: { type: Buffer},
  location: { type: String}, //off-DB store location
  hasThumbnail: {type: Boolean},
  thumbnail: { type: Buffer}
});

const fileLabelsSchema = new Schema({
  label: { type: String},
  created: { type: Date, default: Date.now },
});

module.exports = {
  fileSchema: fileSchema,
  fileLabelsSchema: fileLabelsSchema,
}