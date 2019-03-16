const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const fileSchema = new Schema({
  name: { type: String, maxlength: 128},
  type: { type: String},
  md5: { type: String},
  size: { type: Number},
  reference: { type: String}, //used by which records
  created: { type: Date, default: Date.now },
  data: { type: Buffer}
});


module.exports = fileSchema;