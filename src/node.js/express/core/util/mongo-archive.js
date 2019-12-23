function queryDocIncludes(obj, key) {
  if (Array.isArray(obj)) {
    let include = false;
    for (const arr of obj) {
      include = include || queryDocIncludes(arr, key);
    }
    return include;
  }

  // object
  if (typeof obj ==='object') {
    if (typeof obj[key] !== 'undefined') {
      return true;
    }
    if (typeof obj['$and'] !== 'undefined') {
      return queryDocIncludes(obj['$and'], key);
    }
    return false;
  }
  return false;
}

module.exports = function archiveDocument(schema, options) {
  schema.add({ archived: Boolean, archivedAt: Date });

  schema.methods.archive = function(cb) {
    this.archived = true;
    this.archivedAt = new Date();
    return this.save(cb);
  };

  schema.statics.archive = function(first, second) {
    let callback;
    let conditions;

    if (typeof first === 'function') {
      callback = first;
      conditions = {};
    } else {
      callback = second;
      conditions = first;
    }

    if (typeof callback !== 'function') {
      throw new Error('Wrong arguments - callback must be a function!');
    }

    const update = {
      archived: true,
      archivedAt: new Date()
    };

    this.update(conditions, update, function(err, raw) {
      if (err) {
        return callback(err);
      }
      // `raw` is raw mongo output
      callback(null, raw);
    });
  };

  schema.methods.unarchive = function(callback) {
    // unset
    this.archived = undefined;
    this.archivedAt = undefined;
    this.save(callback);
  };
  


  schema.statics.unarchive = function(first, second) {
    var callback;
    var conditions;

    if (typeof first === 'function') {
      callback = first;
      conditions = {};
    } else {
      callback = second;
      conditions = first;
    }

    if (typeof callback !== 'function') {
      throw new Error('Wrong arguments - callback must be a function!');
    }

    var update = {
      $unset: {
        archived: 1,
        archivedAt: 1
      }
    };

    this.update(conditions, update, function(err, raw) {
      if (err) {
        return callback(err);
      }
      // `raw` is raw mongo output
      callback(null, raw);
    });
  };

  ['find', 'findOne', 'findOneAndRemove', 'findOneAndUpdate'].forEach(method => {
    schema.pre(method, function () {
      const query = this.getQuery();

      if (!queryDocIncludes(query, 'archived') && !queryDocIncludes(query, '_id')) {
        this.where({
          archived: {
            '$ne': true
          }
        });
      }
    });
  });
};
