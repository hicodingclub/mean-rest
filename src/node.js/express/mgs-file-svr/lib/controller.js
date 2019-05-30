const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const sizeOf = require('image-size')
const fs = require('fs');

const schemas = require('../model/schema');
const fileSchema = schemas.fileSchema;
const fileLabelsSchema = schemas.fileLabelsSchema;
const File = mongoose.model('mfile', fileSchema);
const FileLabels = mongoose.model('mfilelabels', fileLabelsSchema);

const sOptions = {
};
const configs = {
};

defaultSOption = {
  storage: 'db',
  linkRoot: ''   // link = moduleName.toLowerCase() + "/download" - download needs to be enabled.
};
/* Config examples:
const fileSOption = {
        storage: "fs",
        directory: path.join(__dirname, 'storage', 'uploads'),
        linkRoot: "/api/files", //link = linkRoot + "/download" - download needs to be enabled.
}
const dbSOption = {
        storage: 'db',
        linkRoot: '/api/files'   //link = linkRoot + "/download" - download needs to be enabled.
}
*/

const getOptionByName = function(moduleName) {
  return sOptions[moduleName] || defaultSOption;
};
const getConfigByName = function(moduleName) {
  return configs[moduleName] || {  owner: {enable: true, type: 'module'} };
};

const ownerPatch = function (query, owner, req) {
  if (owner && owner.enable) {
    if (owner.type === 'module') {
      query.mmodule_name = req.mddsModuleName;
    } else if (owner.type === 'user') {
      query.muser_id = req.muser._id;
    }
  }
  return query;
};

const StoreToFileSystem = function(file, fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId);
  file.mv(fileName, function(err) {
    if (err) {
      return cb(err, null)
    }
    return cb(null, fileName)
  });
};

const StoreThumbnailToFileSystem = function(buffer, file, directory, cb) {
  if (!buffer) {
    return cb(null, 0);
  }
  let fileName = path.join(directory, file);
  
  fs.writeFile(fileName, buffer, (err, bytes) => {
    if (err) { return cb(err); }
    return cb(null, bytes);
  });
};

const LoadFromFileSystem = function(fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId)
  fs.readFile(fileName, function (err, data) {
    return cb(err, data);
  });
};

const DeleteFromFileSystem = function(fileId, directory, hasFile, cb) {
  if (!hasFile) {return cb(null);}
  
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId)
  fs.unlink(fileName, function (err) {
    return cb(err);
  });
};

class FileController {
  constructor() { }

  static setConfig(moduleName, config) {
    configs[moduleName] = config;
  }

  static setOption(moduleName, option) {
    switch (option.storage) {
      case 'fs':
        if (!option.directory) {
          throw "File Server: storage directory must be provided for storage type 'fs'";
        }
        /*
        if (!fs.existsSync(option.directory)) {
          fs.mkdirSync(option.directory, {recursive: true});
        }
        */
        if (!fs.existsSync(option.directory)) {
          throw "File Server: storage directory doesn't exist for storage type 'fs': " + option.directory;
        }
        if (!("linkRoot" in option)) {
          throw "File Server: please provide 'linkRoot' for storage type " + option.storage;
        }
        break;
      case 'db':
        if (!("linkRoot" in option)) {
          throw "File Server: please provide 'linkRoot' for storage type " + option.storage;
        }
        break;
      default:
        console.error("File Server: storage type is not supported:", option.storage);
    }
    sOptions[moduleName] = option;
  }

  static async Create(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = getOptionByName(moduleName);
    let owner = getConfigByName(moduleName).owner;
    const files = Object.values(req.files); //[mfile1, mfile2, ... ]
    if (files.length == 0) {
      return next(createError(400, "No files were included in the request."));
    }
    if (files.length > 1) {
      return next(createError(400, "Only one file is allowed in the upload request."));
    }
    const file = files[0];
    if (file.truncated) { //file size > limit
      return next(createError(400, "File size is over the limit: " + file.Name));
    }
    let fo = {
      name: file.name,
      type: file.mimetype,
      size: file.size,
      md5: file.md5,
    };
    let thumbnail;
    try {
      const dimensions = sizeOf(file.data);
      let options = { height: 160, width: Math.floor(160 * dimensions.width / dimensions.height), responseType: 'buffer' };
      thumbnail = await imageThumbnail(file.data.toString('base64'), options);
    }
    catch (err) {
      console.log("thumbnail create error: ", err);
    }
    fo.hasThumbnail = !!thumbnail;
    if (owner && owner.enable) {
      fo = ownerPatch(fo, owner, req);
    }
    if (sOption && sOption.storage == 'db') {
      fo.data = file.data;
      fo.thumbnail = thumbnail;
    }
    File.create(fo, function (err, savedDoc) {
      if (err) {
        return next(err);
      }
      let doc = {
        _id: savedDoc._id,
        name: savedDoc.name,
        type: savedDoc.type,
        size: savedDoc.size,
        md5: savedDoc.md5
      };
      if (sOption && sOption.storage == 'fs') {
        StoreToFileSystem(file, doc._id.toString(), sOption.directory, (err, result) => {
          if (err) {
            File.findByIdAndDelete(doc._id).exec();
            return next(err);
          }
          StoreThumbnailToFileSystem(thumbnail, doc._id.toString() + '_thumbnail', sOption.directory, (err, result) => {
            if (err) {
              File.findByIdAndDelete(doc._id).exec();
              return next(err);
            }
            savedDoc.link = sOption.linkRoot + '/download/' + doc._id.toString();
            savedDoc.save();
            doc.link = savedDoc.link;
            return res.send(doc);
          });
        });
      }
      else if (sOption && sOption.storage == 'db') {
        savedDoc.link = sOption.linkRoot + '/download/' + doc._id.toString();
        savedDoc.save();
        doc.link = savedDoc.link;
        return res.send(doc);
      }
    });
  }
  
  static Download(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = getOptionByName(moduleName);
    let fileName = req.params["fileID"];
    let id = fileName;
    let thumbnail = false;
    if (fileName.includes('_thumbnail')) {
      id = fileName.replace('_thumbnail', '');
      thumbnail = true;
    }
    let dbExec = File.findById(id, function (err, doc) {
      if (err) {
        return next(err);
      }
      if (thumbnail && !doc.hasThumbnail) {
        return next(createError(404, "File not found."));
      }
      if (sOption && sOption.storage == 'fs') {
        LoadFromFileSystem(fileName, sOption.directory, (err, data) => {
          if (err) {
            return next(err);
          }
          return res.send(data);
        });
      }
      else if (sOption && sOption.storage == 'db') {
        if (thumbnail) {
          return res.send(doc.thumbnail);
        }
        return res.send(doc.data);
      }
    });
  }
  static Delete(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = getOptionByName(moduleName);
    let id = req.params["fileID"];
    File.findByIdAndDelete(id).exec(function (err, result) {
      if (err) {
        return next(err);
      }
      if (sOption && sOption.storage === 'fs') {
        DeleteFromFileSystem(doc._id.toString(), sOption.directory, true, (err) => {
          if (err) {
            return next(err);
          }
          DeleteFromFileSystem(doc._id.toString() + '_thumbnail', sOption.directory, doc.hasThumbnail, (err) => {
            if (err) {
              return next(err);
            }
            return res.send();
          });
        });
      }
      else if (sOption && sOption.storage === 'db') {
        return res.send();
      }
    });
  }
}

module.exports = FileController;
