const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
var fs = require('fs');

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
  linkRoot: ''   //link = moduleName.toLowerCase() + "/download" - download needs to be enabled.
};
/* Config examples:
const fileSOption = {
        storage: "fs",
        directory: path.join(__dirname, 'public-admin', 'storage', 'uploads'),
        linkRoot: "/storage/uploads", //directly download from uploads dir as static file
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
  if (owner && owner.enabled) {
    if (owner.type === 'module') {
      query.mmodule_name = req.mddsModuleName;
    } else if (owner.type === 'user') {
      query.muser_id = req.muser._id;
    }
  }
  return query;
};

const FileController = function() {};

FileController.setConfig = function(moduleName, config) {
  configs[moduleName] = config;
};

FileController.setOption = function(moduleName, option) {
  switch (option.storage) {
    case 'fs':
      if (!option.directory) {
        throw "File Server: storage directory must be provided for storage type 'fs'";
      }
      if (!fs.existsSync(option.directory)) {
        fs.mkdirSync(option.directory, {recursive: true});
      }
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
};


FileController.Create = function(req, res, next) {
  let moduleName = req.mddsModuleName;
  let sOption = getOptionByName(moduleName);
  let owner = getConfigByName(moduleName).owner;
  
  const files = Object.values(req.files);//[mfile1, mfile2, ... ]
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
    //data: file.data
  };

  if (owner && owner.enable) {
    fo = ownerPatch(fo, owner, req);
  }
  
  if (sOption && sOption.storage == 'db') {
    fo.data = file.data
  }
  
  File.create(fo, function (err, savedDoc) {
    if (err) { return next(err); }
    
    let doc = {
      _id: savedDoc._id,
      name: savedDoc.name,
      type: savedDoc.type,
      size: savedDoc.size,
      md5: savedDoc.md5
    }
    if (sOption && sOption.storage == 'fs') {
      StoreToFileSystem(file, doc._id.toString(), sOption.directory, (err, result) => {
        if (err) {
          File.findByIdAndDelete(doc._id).exec();
          return next(err); 
        }
        savedDoc.link = sOption.linkRoot + "/" + doc._id.toString();
        savedDoc.save();
        doc.link = savedDoc.link;
        return res.send(doc);
      });
    } else if (sOption && sOption.storage == 'db') {
      savedDoc.link = sOption.linkRoot + '/download/' + doc._id.toString();
      savedDoc.save();
      doc.link = savedDoc.link;
      return res.send(doc);
    }
  }); 
};

FileController.Download = function(req, res, next) {
  let moduleName = req.mddsModuleName;
  let sOption = getOptionByName(moduleName);

  let id = req.params["fileID"];

  let dbExec = File.findById(id, function (err, doc) {
    if (err) {
      return next(err); 
    }
    if (sOption && sOption.storage == 'fs') {
      LoadFromFileSystem(doc._id.toString(), sOption.directory, (err, data) => {
        if (err) {
          return next(err); 
        }
        return res.send(data);
      });
    } else if (sOption && sOption.storage == 'db') {
      return res.send(doc.data);
    }
  });
};

FileController.Delete = function(req, res, next) {
  let moduleName = req.mddsModuleName;
  let sOption = getOptionByName(moduleName);

  let id = req.params["fileID"];

  File.findByIdAndDelete(id).exec(function (err, result) {
    if (err) { return next(err); }
    if (sOption && sOption.storage == 'fs') {
      DeleteFromFileSystem(doc._id.toString(), sOption.directory, (err) => {
        if (err) {
          return next(err); 
        }
        return res.send();
      });
    } else if (sOption && sOption.storage == 'db') {
      return res.send();
    }
  });
};

const StoreToFileSystem = function(file, fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId)
  file.mv(fileName, function(err) {
    if (err) {
      return cb(err, null)
    }
    return cb(null, fileName)
  });
};

const LoadFromFileSystem = function(fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId)
  fs.readFile(fileName, function (err, data) {
    return cb(err, data);
  });
};

const DeleteFromFileSystem = function(fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId)
  fs.unlink(fileName, function (err) {
    return cb(err);
  });
};

module.exports = FileController;