const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const sizeOf = require('image-size')
const fs = require('fs');

const schemas = require('../model/schema');
const { type } = require('os');
const { fileSchema, fileGroupSchema, DB_CONFIG} = schemas;

let db_app_name, db_module_name;
if (DB_CONFIG) {
  db_app_name = DB_CONFIG.APP_NAME;
  db_module_name = DB_CONFIG.MODULE_NAME;
}
if (!db_app_name || !db_module_name) {
  throw new Error(`APP Name and Module Name not provided for database. Please provide "DB_CONFIG" for your schema definition in module ${moduleName}.`);
}
db_app_name = db_app_name.toLowerCase();
db_module_name = db_module_name.toLowerCase();

const File = mongoose.model('mfile', fileSchema, `${db_app_name}_${db_module_name}_mfile`);
const FileGroup = mongoose.model('mfilegroup', fileGroupSchema, `${db_app_name}_${db_module_name}_mfilegroup`);

const MddsFileCrop= "mdds-file-crop";

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

const create_random = function(){
  let dt = new Date().getTime();
  // const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  const random = 'xxxxxxxx';
  const result = random.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return result;
}

const ownerPatch = function (query, owner, req) {
  if (owner && owner.enable) {
    if (owner.type === 'module') {
      query.mmodule_name = req.mddsModuleName;
    } else if (owner.type === 'user') {
      if (req.muser) {
        // user logged in
        if (!!owner.field) {
          query[owner.field] = req.muser._id;
        } else {
          query.muser_id = req.muser._id;
        }
      }
    }
  }
  return query;
};

const getUserId = function (req) {
  if (req.muser) {
    return req.muser._id;
  }
  return 'unknown'; //unknown users
}

const StoreToFileSystem = function(file, fileId, directory) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId);
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    } catch (err) {
      reject(err);
    }


    file.mv(fileName, function(err) {
      if (err) {
        return reject(err)
      }
      return resolve(fileName)
    });
  });
};

const StoreThumbnailToFileSystem = function(buffer, file, directory) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    } catch (err) {
      return reject(err);
    }

    if (!buffer) {
      return reject(new Error('No thing to write to file'));
    }
    let fileName = path.join(directory, file);
    
    fs.writeFile(fileName, buffer, (err, bytes) => {
      if (err) { return reject(err); }
      return resolve(bytes);
    });
  })
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
  
  // Use the mv() method to remove the file
  let fileName = path.join(directory, fileId)
  fs.unlink(fileName, function (err) {
    return cb(err);
  });
};

class FileController {
  sOption = defaultSOption;
  config = {  owner: {enable: true, type: 'module'} };
  
  constructor() { }
  getOption = function() {
    return this.sOption ;
  };
  getConfig = function() {
    return this.config;
  };
  setConfig(moduleName, config) {
    this.config = config;
  }
  setOption(moduleName, option) {
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
      default:
        console.error("File Server: storage type is not supported:", option.storage);
    }
    this.sOption = option;
  }

  async Create(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let owner = this.getConfig().owner;
    const files = Object.values(req.files); //[mfile1, mfile2, ... ]

    let fileID = req.params["fileID"];

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

    let fileName, groupName;
    try {
      const nameStructure = JSON.parse(decodeURI(file.name));
      fileName = nameStructure.name;
      groupName = nameStructure.group;
    } catch (e) {
      fileName = file.name;
      groupName = null;
    }

    const skipDb = groupName === MddsFileCrop ? true : false;

    let fo = {
      name: fileName,
      group: groupName,
      type: file.mimetype,
      size: file.size,
      md5: file.md5,
    };
    let filter = {
      _id: "doesn't exist"
    };
    let thumbnail;
  
    if (fo.type.startsWith('image/')) {
      // generate thumbnail for image files
      try {
        const dimensions = sizeOf(file.data);
        let options = { height: 160, width: Math.floor(160 * dimensions.width / dimensions.height), responseType: 'buffer' };
        thumbnail = await imageThumbnail(file.data.toString('base64'), options);
      } catch (err) {
        console.log("thumbnail create error: ", err);
      }
    }
    fo.hasThumbnail = !!thumbnail;
    if (owner && owner.enable) {
      fo = ownerPatch(fo, owner, req);
    }
    if (fileID) {
      fo._id = fileID;
      filter._id = fileID;
    }
    let savedDocId;
    try {
      let savedDoc;
      if (skipDb) {
        savedDoc = fo;
        savedDoc['_id'] = `${fo.group}-${fo.name}-${create_random()}`;
      } else {
        // save or update DB record
        if (fileID) {
          await File.update(filter, fo, {upsert: true, setDefaultsOnInsert: true});
          savedDoc = fo;
          savedDoc._id = filter._id;
        } else {
          savedDoc = await File.create(fo);
        }
      }

      savedDocId = savedDoc._id;
      const doc = {
        _id: savedDoc._id,
        name: savedDoc.name,
        type: savedDoc.type,
        size: savedDoc.size,
        md5: savedDoc.md5
      };
      let fsFileName = doc._id.toString();
      let fsFileNameThumbnail = doc._id.toString() + '_thumbnail';

      let fsDirecotry = sOption.directory;
      let downloadLink = sOption.linkRoot + '/download/' + fsFileName;

      if (owner && owner.type === 'user') {
        // user specific files will store under 'users/<user_id>/original_file.name'
        fsFileName = doc.name;
        fsFileNameThumbnail = doc.name + '_thumbnail';
        fsDirecotry = path.join(sOption.directory, 'users', getUserId(req));

        downloadLink = sOption.linkRoot + '/download/' + 'users/' + getUserId(req) + '/' + fsFileName;
      }

      if (sOption && sOption.storage == 'fs') {
        await StoreToFileSystem(file, fsFileName, fsDirecotry);

        savedDoc.link = downloadLink;
        doc.link = savedDoc.link;
        if (!skipDb) {
          savedDoc.save();
        }
        if (!!thumbnail) {
          await StoreThumbnailToFileSystem(thumbnail, fsFileNameThumbnail, fsDirecotry);
        }
        return res.send(doc);
      }
    } catch (err) {
      if (!skipDb && savedDocId) {
        File.findByIdAndDelete(savedDocId).exec();
      }
      return next(err);
    }
  }
  
  Download(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let fileName = req.params["fileID"];
    console.log('fileName====', fileName);
    let id = fileName;
    let thumbnail = false;
    if (fileName.endsWith('_thumbnail')) {
      id = fileName.replace(/_thumbnail$/, '');
      thumbnail = true;
    }
    let skipDb = false;
    if (fileName.startsWith(MddsFileCrop)) {
      skipDb = true;
    }
    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());

    function loadAll(filename, directory) {
      LoadFromFileSystem(filename, directory, (err, data) => {
        if (err) {
          return next(err);
        }

        return res.send(data);
      });
    }

    if (!skipDb) {
      File.findById(id, function (err, doc) {
        if (err) {
          return next(err);
        }
        if (thumbnail && !doc.hasThumbnail) {
          return next(createError(404, "File not found."));
        }
        if (sOption && sOption.storage == 'fs') {
          loadAll(fileName, sOption.directory);
        }
      });
    } else {
      if (sOption && sOption.storage == 'fs') {
        loadAll(fileName, sOption.directory);
      }
    }
  }

  DownloadUsers(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let filePath = req.originalUrl.split('/download/users/')[1];
    
    let [userId, fileName] = filePath.split('/');
    fileName = decodeURI(fileName);
    let directory = path.join(sOption.directory, 'users', userId);
    
    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());

    function loadAll(filename, directory) {
      LoadFromFileSystem(filename, directory, (err, data) => {
        if (err) {
          return next(err);
        }

        return res.send(data);
      });
    }

    loadAll(fileName, directory);
  }

  Delete(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let id = req.params["fileID"];

    let skipDb = false;
    if (fileName.startsWith(MddsFileCrop)) {
      skipDb = true;
    }

    function deleteAll(docId, directory, hasThumbnail) {
      if (sOption && sOption.storage === 'fs') {
        DeleteFromFileSystem(docId.toString(), directory, true, (err) => {
          if (err) {
            return next(err);
          }
          DeleteFromFileSystem(docId.toString() + '_thumbnail', directory, hasThumbnail, (err) => {
            if (err) {
              return next(err);
            }
            return res.send();
          });
        });
      }
    }

    if (!skipDb) {
      File.findByIdAndDelete(id).exec(function (err, result) {
        if (err) {
          return next(err);
        }
        deleteAll(doc._id, sOption.directory, doc.hasThumbnail);
      });
    } else {
      deleteAll(id, sOption.directory, true);
    }
  }

  DeleteById(id, hasThumbnail) {
    let sOption = this.getOption();
    if (sOption && sOption.storage === 'fs') {
      let directory = sOption.directory;
      DeleteFromFileSystem(id.toString(), directory, true, (err) => {
        if (err) {
          console.error(`Failed to delete ${id}`, err);
        }
      });
      if (!hasThumbnail) {
        return;
      }
      DeleteFromFileSystem(id.toString() + '_thumbnail', directory, true, (err) => {
        if (err) {
          console.error(`Failed to delete ${id}__thumbnail`, err);
        }
      });
    }
  }
}

module.exports = FileController;
