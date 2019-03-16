const mongoose = require('mongoose');
const createError = require('http-errors');

const fileSchema = require('./file.model');
const File = mongoose.model('mfile', fileSchema);

const FileController = function() {}

FileController.Create = function(req, res, next) {
  const files = Object.keys(req.files);//[mfile1, mfile2, ... ]
  if (files.length == 0) {
    return next(createError(400, "No files were included in the request."));
  }
  
  //const fileObjects = {};
  const fileObjects = [];

  for (let f of files) {
    let file = req.files[f];
    if (file.truncated) { //file size > limit
      return next(createError(400, "File size is over the limit: " + file.Name));
    }
    const fo = {
            name: file.name,
            type: file.mimetype,
            size: file.size,
            md5: file.md5,
            data: file.data
          }
    /* This is the logic using async.parallel
    const fileObject = new File();
    fileObjects[file.name] = function(cb) {
      fileObject.save(cb);
    };
    */
    
    fileObjects.push(fo);
  }

  /* Will return error as soon as one save failed. Other might still continue to insert but we don't know...
  const async = require('async');
  async.parallel(fileObjects, (err, result)=>{
    console.log("***err", err);
    console.log("***result", result);
    if (err) { return next(err); }
    return res.send(result);
  })
  */
  
  const options = {ordered: true}; //either insert all or fail
  //if true, will fail fast on the first error encountered. If false, will insert all the documents 
  //it can and report errors later. Mongoose always validates each document before sending insertMany to MongoDB. 
  //So if one document has a validation error, no documents will be saved, unless you set the ordered option to false.
  File.insertMany(fileObjects, (err, result)=>{
    if (err) { return next(err); }
    const docs = result.map(d => {
      return {
              _id: d._id,
              name: d.name,
              type: d.type,
              size: d.size,
              md5: d.md5
      };
    })
    return res.send(docs);
  });
};

module.exports = FileController;