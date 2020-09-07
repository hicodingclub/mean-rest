const mongoose = require('mongoose');
const Schema = mongoose.Schema;

function getSchema(fileCategory) {
  const groupSchemaRef = `m${fileCategory}group`;

  const schema = new Schema(
    {
      name: { type: String, maxlength: 128 },
      type: { type: String },
      group: {
        type: Schema.Types.ObjectId,
        ref: groupSchemaRef,
        required: false,
      },
      labels: { type: [String] },
      md5: { type: String },
      size: { type: Number },
      data: { type: Buffer },
      location: { type: String }, //off-DB store location
      hasThumbnail: { type: Boolean },
      thumbnail: { type: Buffer },
      muser_id: { type: String },
      mmodule_name: { type: String },
    },
    { timestamps: true }
  );

  if (fileCategory === 'picture') {
    schema.add(
      { link: { type: String, mraType: 'picture' } } //download link
    );
  } else if (fileCategory === 'file') {
    schema.add(
      { link: { type: String, mraType: 'httpurl' } } //download link
    );
  }

  return schema;
}

const pictureSchema = getSchema('picture');
const pictureGroupSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);
pictureGroupSchema.index({ name: 1 }, { unique: true });

const fileSchema = getSchema('file');
const fileGroupSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);
fileGroupSchema.index({ name: 1 }, { unique: true });

const DB_CONFIG = {
  APP_NAME: process.env.APP_NAME,
  MODULE_NAME: 'FILE',
};
module.exports = {
  pictureSchema,
  pictureGroupSchema,
  fileSchema,
  fileGroupSchema,
  DB_CONFIG,
};
