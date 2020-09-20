const mongoose = require('mongoose');
const createError = require('http-errors');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const sizeOf = require('image-size');
const fs = require('fs');

const schemas = require('../model/schema');
const { type } = require('os');
const {
  fileSchema,
  fileGroupSchema,
  pictureSchema,
  pictureGroupSchema,
  DB_CONFIG,
} = schemas;

let db_app_name, db_module_name;
if (DB_CONFIG) {
  db_app_name = DB_CONFIG.APP_NAME;
  db_module_name = DB_CONFIG.MODULE_NAME;
}
if (!db_app_name || !db_module_name) {
  throw new Error(
    `APP Name and Module Name not provided for database. Please provide "DB_CONFIG" for your schema definition in module ${moduleName}.`
  );
}
db_app_name = db_app_name.toLowerCase();
db_module_name = db_module_name.toLowerCase();

const File = mongoose.model(
  'mfile',
  fileSchema,
  `${db_app_name}_${db_module_name}_mfile`
);
const FileGroup = mongoose.model(
  'mfilegroup',
  fileGroupSchema,
  `${db_app_name}_${db_module_name}_mfilegroup`
);

const Picture = mongoose.model(
  'mpicture',
  pictureSchema,
  `${db_app_name}_${db_module_name}_mpicture`
);
const PictureGroup = mongoose.model(
  'mpicturegroup',
  pictureGroupSchema,
  `${db_app_name}_${db_module_name}_mpicturegroup`
);

const MddsFileCrop = 'mdds-file-crop';

defaultSOption = {
  storage: 'db',
  linkRoot: '', // link = moduleName.toLowerCase() + '/download' - download needs to be enabled.
};
/* Config examples:
const fileSOption = {
        storage: 'fs',
        directory: path.join(__dirname, 'storage', 'uploads'),
        linkRoot: '/api/files', //link = linkRoot + '/download' - download needs to be enabled.
}
const dbSOption = {
        storage: 'db',
        linkRoot: '/api/files'   //link = linkRoot + '/download' - download needs to be enabled.
}
*/

const create_random = function () {
  let dt = new Date().getTime();
  // const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  const random = 'xxxxxxxx';
  const result = random.replace(/[xy]/g, function (c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return result;
};

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
};

const StoreToFileSystem = function (file, fileId, directory) {
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

    file.mv(fileName, function (err) {
      if (err) {
        return reject(err);
      }
      return resolve(fileName);
    });
  });
};

const StoreThumbnailToFileSystem = function (buffer, file, directory) {
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
      if (err) {
        return reject(err);
      }
      return resolve(bytes);
    });
  });
};

const LoadFromFileSystem = function (fileId, directory, cb) {
  // Use the mv() method to place the file somewhere on your server
  let fileName = path.join(directory, fileId);
  fs.readFile(fileName, function (err, data) {
    return cb(err, data);
  });
};

const DeleteFromFileSystem = function (fileId, directory, hasFile, cb) {
  if (!hasFile) {
    return cb(null);
  }

  // Use the mv() method to remove the file
  let fileName = path.join(directory, fileId);
  fs.unlink(fileName, function (err) {
    return cb(err);
  });
};

const getThumbnail = async function (fo, fileCategory, file) {
  let thumbnail;
  // Only get thumbnail for pictures
  if (fileCategory === 'picture' && fo.type.startsWith('image/')) {
    // generate thumbnail for image files
    try {
      const dimensions = sizeOf(file.data);
      let options = {
        height: 160,
        width: Math.floor((160 * dimensions.width) / dimensions.height),
        responseType: 'buffer',
      };
      thumbnail = await imageThumbnail(file.data.toString('base64'), options);
    } catch (err) {
      console.log('thumbnail create error: ', err);
    }
  }
  return thumbnail;
};

const getStoragePath = function (
  owner,
  doc,
  fileCategory,
  userID,
  croppedImage
) {
  let savedDocId = doc._id.toString();
  let crop = croppedImage ? `-cr${create_random()}` : '';
  let idDir = savedDocId.slice(-2); // last two characters

  let fsFileName = `${savedDocId}${crop}__${doc.name}`;
  let fsFileNameThumbnail = `${savedDocId}${crop}__${doc.name}_thumbnail`;
  let fsSubDirecotry = path.join(fileCategory, idDir);

  if (owner && owner.type === 'user') {
    fsSubDirecotry = path.join('users', userID, fsSubDirecotry);
  }

  return [fsFileName, fsFileNameThumbnail, fsSubDirecotry];
};

const processDownloadUrl = function (url) {
  let thumbnail = false;
  let link = url;
  if (link.endsWith('_thumbnail')) {
    link = link.replace(/_thumbnail$/, '');
    thumbnail = true;
  }

  let filePath = link.substring(
    link.indexOf('/download/') + '/download/'.length
  );
  let fileCategory = 'picture';

  function getID(originalFileName) {
    let pos = originalFileName.indexOf('__');
    let uploadFileName = pos >=0 ? originalFileName.substring(pos+2) : originalFileName;

    let idPart = originalFileName.split('__')[0]; // get the ID Part
    let id = idPart;
    let croppedImage = false;
    if (
      originalFileName.startsWith(MddsFileCrop) ||
      originalFileName.includes('-cr')
    ) {
      croppedImage = true;
      // remove the crop part from idPart
      id = idPart.replace(`${MddsFileCrop}-`, '').replace(/-cr.*/, '');
    }

    return [croppedImage, id, uploadFileName];
  }

  if (!filePath.includes('/')) {
    // legacy picture
    // fileName = filePath
    let fileName = decodeURI(filePath);
    let [croppedImage, id, uploadFileName] = getID(fileName);
    return {
      id,
      croppedImage,
      thumbnail,
      fileCategory,
      fileSubDir: '',
      fileName,
      uploadFileName,
    };
  }

  let lastSepPos = filePath.lastIndexOf('/');
  let fileDir = filePath.substring(0, lastSepPos);
  let fileSubDir = fileDir.split('/').join(path.sep);
  let fileName = decodeURI(filePath.substring(lastSepPos + 1));
  let [croppedImage, id, uploadFileName] = getID(fileName);

  if (fileDir.startsWith('users')) {
    // users/<id/[file|picture]
    fileCategory = fileDir.split('/')[2];
  } else if (fileDir.startsWith('picture')) {
    fileCategory = 'picture';
  } else if (fileDir.startsWith('file')) {
    fileCategory = 'file';
  }

  return {
    id,
    croppedImage,
    thumbnail,
    fileCategory,
    fileSubDir,
    fileName,
    uploadFileName,
  };
};

class FileController {
  sOption = defaultSOption;
  config = { owner: { enable: true, type: 'module' } };

  constructor() {}
  getOption = function () {
    return this.sOption;
  };
  getConfig = function () {
    return this.config;
  };
  setConfig(moduleName, config) {
    this.config = config;
  }
  setOption(moduleName, option) {
    switch (option.storage) {
      case 'fs':
        if (!option.directory) {
          throw `File Server: storage directory must be provided for storage type 'fs'`;
        }
        /*
        if (!fs.existsSync(option.directory)) {
          fs.mkdirSync(option.directory, {recursive: true});
        }
        */
        if (!fs.existsSync(option.directory)) {
          throw (
            `File Server: storage directory doesn't exist for storage type 'fs': ` +
            option.directory
          );
        }
        if (!('linkRoot' in option)) {
          throw (
            `File Server: please provide 'linkRoot' for storage type ` +
            option.storage
          );
        }
        break;
      default:
        console.error(
          `File Server: storage type is not supported:`,
          option.storage
        );
    }
    this.sOption = option;
  }

  async Create(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let owner = this.getConfig().owner;
    const files = Object.values(req.files); //[mfile1, mfile2, ... ]

    if (files.length == 0) {
      return next(createError(400, 'No files were included in the request.'));
    }
    if (files.length > 1) {
      return next(
        createError(400, 'Only one file is allowed in the upload request.')
      );
    }
    const file = files[0];
    if (file.truncated) {
      //file size > limit
      return next(
        createError(400, 'File size is over the limit: ' + file.Name)
      );
    }

    let fileName, groupName, fileCategory;
    try {
      const nameStructure = JSON.parse(decodeURI(file.name));
      fileName = nameStructure.name;
      groupName = nameStructure.group;
      fileCategory = nameStructure.fileCategory;
    } catch (e) {
      fileName = file.name;
      groupName = null;
    }

    let FileModel = fileCategory === 'file' ? File : Picture;

    // cropped files. don't store in DB.
    // TODO: clean up cropped files
    const croppedImage = groupName === MddsFileCrop ? true : false;

    let fo = {
      name: fileName,
      group: groupName,
      type: file.mimetype,
      size: file.size,
      md5: file.md5,
    };

    let thumbnail = await getThumbnail(fo, fileCategory, file);
    fo.hasThumbnail = !!thumbnail;

    if (owner && owner.enable) {
      fo = ownerPatch(fo, owner, req);
    }

    let dbCreated = false;
    let savedDocId;
    try {
      let savedDoc;
      if (croppedImage) {
        // cropped file. Don't store in DB
        savedDoc = fo;
        // two format: (1) version 1: <id>, (2) version 2: <id>__<filename>
        let nameArr = fo.name.split('__');
        savedDoc['_id'] = nameArr[0]; // original ID
      } else {
        savedDoc = await FileModel.create(fo);
        savedDocId = savedDoc['_id'];
        dbCreated = true;
      }

      const doc = {
        _id: savedDoc._id,
        name: savedDoc.name,
        type: savedDoc.type,
        size: savedDoc.size,
        md5: savedDoc.md5,
      };

      let [fsFileName, fsFileNameThumbnail, fsSubDir] = getStoragePath(
        owner,
        doc,
        fileCategory,
        getUserId(req),
        croppedImage
      );

      let fsDirecotry = path.join(sOption.directory, fsSubDir);

      let fsSubPathArr = fsSubDir.split(path.sep);
      fsSubPathArr.push(fsFileName);
      console.log(`==== fsSubPathArr: `, fsSubPathArr);

      let downloadLink = [sOption.linkRoot, 'download']
        .concat(fsSubPathArr)
        .join('/');

      if (sOption && sOption.storage == 'fs') {
        await StoreToFileSystem(file, fsFileName, fsDirecotry);

        savedDoc.link = downloadLink;
        doc.link = savedDoc.link;
        if (!croppedImage) {
          savedDoc.save();
        }
        if (!!thumbnail) {
          await StoreThumbnailToFileSystem(
            thumbnail,
            fsFileNameThumbnail,
            fsDirecotry
          );
        }
        return res.send(doc);
      }
    } catch (err) {
      if (dbCreated) {
        FileModel.findByIdAndDelete(savedDocId).exec();
      }
      return next(err);
    }
  }

  Download(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();

    let fileObj = processDownloadUrl(req.originalUrl);

    // console.log('==== Download: ', req.originalUrl);
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());

    function loadAll(filename, directory) {
      LoadFromFileSystem(filename, directory, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            return next(createError(404, 'File not found'));
          }
          return next(err);
        }
        return res.send(data);
      });
    }

    /* No need to check the DB
    if (!croppedImage) {
      File.findById(id, function (err, doc) {
        if (err) {
          return next(err);
        }
        if (thumbnail && !doc.hasThumbnail) {
          return next(createError(404, 'File not found.'));
        }
        if (sOption && sOption.storage == 'fs') {
          loadAll(fileName, sOption.directory);
        }
      });
    } 
    */
    let fsDirectory = path.join(sOption.directory, fileObj.fileSubDir);
    let fsFileName = fileObj.fileName;
    if (sOption && sOption.storage == 'fs') {
      loadAll(fsFileName, fsDirectory);
    } else {
      return next(createError(500, 'Non FileSystem storage not supported.'));
    }
  }

  /*
  DownloadUsers(req, res, next) {
    let moduleName = req.mddsModuleName;
    let sOption = this.getOption();
    let filePath = req.originalUrl.split('/download/users/')[1];
    
    let [userId, fileName] = filePath.split('/');
    fileName = decodeURI(fileName);
    let directory = path.join(sOption.directory, 'users', userId);
    
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    res.setHeader('Expires', new Date(Date.now() + 2592000000).toUTCString());

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
    let id = req.params['fileID'];

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
  */

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
      DeleteFromFileSystem(
        id.toString() + '_thumbnail',
        directory,
        true,
        (err) => {
          if (err) {
            console.error(`Failed to delete ${id}__thumbnail`, err);
          }
        }
      );
    }
  }

  DeleteByLink(link, hasThumbnail) {
    let sOption = this.getOption();
    let fileObj = processDownloadUrl(link);

    let fsDirectory = path.join(sOption.directory, fileObj.fileSubDir);
    let fsFileName = fileObj.fileName;

    if (sOption && sOption.storage === 'fs') {
      DeleteFromFileSystem(fsFileName, fsDirectory, true, (err) => {
        if (err) {
          console.error(`Failed to delete ${id}`, err);
        }
      });
      if (!hasThumbnail) {
        return;
      }
      DeleteFromFileSystem(
        fsFileName + '_thumbnail',
        fsDirectory,
        true,
        (err) => {
          if (err) {
            console.error(`Failed to delete ${id}__thumbnail`, err);
          }
        }
      );
    } else {
      console.error('Non FileSystem storage not supported.');
    }
  }
}

module.exports = FileController;
