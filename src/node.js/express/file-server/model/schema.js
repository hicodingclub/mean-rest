const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const fileSchema = new Schema({
  name: { type: String, maxlength: 128},
  type: { type: String},
  group: { type: Schema.Types.ObjectId, ref: 'mfilegroup', required: false },
  labels: {type: [String]},
  md5: { type: String},
  size: { type: Number},
  link: { type: String, mraType: 'picture'}, //download link
  data: { type: Buffer},
  location: { type: String}, //off-DB store location
  hasThumbnail: {type: Boolean},
  thumbnail: { type: Buffer},
  muser_id: { type: String, },
  mmodule_name: { type: String, },
}, {timestamps: true});

const fileGroupSchema = new Schema({
  name: { type: String, required: true},
}, {timestamps: true});

fileGroupSchema.index({ name: 1}, {unique: true});

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'FILE',
};
module.exports = {
        fileSchema,
        fileGroupSchema,
        DB_CONFIG,
}
