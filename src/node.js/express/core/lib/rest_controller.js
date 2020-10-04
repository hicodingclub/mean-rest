const createError = require('http-errors');
const mongoose = require('mongoose');

const MddsUncategorized = 'MddsUncategorized';
const MddsAll = 'MddsAll';

const { exportAllExternal } = require('./rest_ctrl_export');
const {
  emailAllErrorExternal,
  emailAllCheckExternal,
  emailAllExternal,
} = require('./rest_ctrl_email');

const createRegex = function (obj) {
  const fieldRegex = function (field) {
    return new RegExp(
      // Escape all special characters except *
      // Allow the use of * as a wildcard like % in SQL.
      field.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1').replace(/\*/g, '.*'),
      'i'
    );
  };
  if (typeof obj === 'string') {
    return fieldRegex(obj);
  }
  //obj in {key: string} format
  for (let prop in obj) {
    obj[prop] = fieldRegex(obj[prop]);
  }
  return obj;
};

var capitalizeFirst = function (str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

var lowerFirst = function (str) {
  return str.charAt(0).toLowerCase() + str.substr(1);
};

const checkAndSetValue = function (obj, schema) {
  //obj in {item: value} format
  for (let item in obj) {
    if (item in schema.paths) {
      let type = schema.paths[item].constructor.name;
      if (type == 'SchemaDate') {
        if (typeof obj[item] == 'string') {
          //exact data provided:
          let dt = new Date(obj[item]);
          let y = dt.getFullYear(),
            m = dt.getMonth(),
            d = dt.getDate();
          let d1 = new Date(y, m, d);
          let d2 = new Date(y, m, d);

          d2.setDate(d2.getDate() + 1);

          obj[item] = { $gte: d1, $lt: d2 };
        } else if (typeof obj[item] === 'object') {
          //data range
          let o = {};
          if (obj[item]['from']) {
            let dt = new Date(obj[item]['from']);
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d1 = new Date(y, m, d);
            o['$gte'] = dt;
          }
          if (obj[item]['to']) {
            let dt = new Date(obj[item]['to']);
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d2 = new Date(y, m, d);
            //d2.setDate(d2.getDate() + 1);

            o['$lt'] = dt;
          }
          obj[item] = o;
        }
      } else if (type === 'SchemaString') {
        let userInput = obj[item];

        if (userInput) {
          userInput = new RegExp(
            // Escape all special characters
            userInput.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'),
            'i'
          );
        }

        obj[item] = userInput;
      } else if (type == 'SchemaNumber') {
        if (typeof obj[item] === 'object') {
          //data range
          let o = {};
          if (typeof obj[item]['from'] === 'number') {
            let dt = obj[item]['from'];
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d1 = new Date(y, m, d);
            o['$gte'] = dt;
          }
          if (typeof obj[item]['to'] === 'number') {
            let dt = obj[item]['to'];
            //let y = dt.getFullYear(), m = dt.getMonth(), d = dt.getDate();
            //let d2 = new Date(y, m, d);
            //d2.setDate(d2.getDate() + 1);

            o['$lte'] = dt;
          }
          obj[item] = o;
        }
      }
    }
  }
  return obj;
};

const fieldReducerForRef = function (refObj, indexFields) {
  let newRefObj = {};
  if ('_id' in refObj) {
    newRefObj['_id'] = refObj['_id'];
  }
  for (let indexField of indexFields) {
    if (indexField in refObj) {
      newRefObj[indexField] = refObj[indexField];
    }
  }
  return newRefObj;
};

const objectReducerForRef = function (o, populateMap) {
  if (typeof o !== 'object' || o == null) {
    return o;
  }
  let obj = {};
  for (let p in o) {
    obj[p] = o[p];
  }

  for (let path in populateMap) {
    let fields = populateMap[path].match(/\S+/g); // \S matches no space characters.
    if (!fields) continue;

    let indexFields = fields; //use all the fields

    let newRefObj;
    let refObj = obj[path];
    if (typeof refObj !== 'object' || refObj == null) continue;
    if (Array.isArray(refObj)) {
      //list of ref objects
      newRefObj = refObj.map((o) => fieldReducerForRef(o, indexFields)); //recursive call
    } else {
      newRefObj = fieldReducerForRef(refObj, indexFields);
    }
    //now only "_id" and the indexField will be left.
    obj[path] = newRefObj;
  }
  return obj;
};

const getViewPopulates = function (schema, viewStr) {
  let populates = [];
  let viewFields = viewStr.match(/\S+/g) || [];
  viewFields.forEach((item) => {
    if (item in schema.paths) {
      let type = schema.paths[item].constructor.name;
      switch (type) {
        case 'SchemaArray':
          if (schema.paths[item].caster.options.ref) {
            let ref = schema.paths[item].caster.options.ref;
            if (ref) populates.push([item, ref]);
          }
          break;
        case 'ObjectId':
          let ref = schema.paths[item].options.ref;
          if (ref) populates.push([item, ref]);
          break;
        default:
          break;
      }
    }
  });
  return populates;
};

const resultReducerForRef = function (result, populateMap) {
  if (Object.keys(populateMap).length == 0) {
    //not ref fields
    return result;
  }
  if (typeof result !== 'object' || result == null) {
    //array is also object
    return result;
  }

  let r;
  if (Array.isArray(result)) {
    r = result.map((obj) => objectReducerForRef(obj, populateMap));
  } else {
    r = objectReducerForRef(result, populateMap);
  }
  return r;
};

const objectReducerForView = function (obj, viewStr) {
  //console.log("***obj: ", obj);
  //console.log("***viewStr: ", viewStr);
  if (typeof obj !== 'object' || obj == null) {
    return obj;
  }

  let fields = viewStr.match(/\S+/g); // \S matches no space characters.
  if (!fields) return obj;

  let newObj = {};
  newObj['_id'] = obj['_id'];
  if ('archived' in obj) {
    newObj['archived'] = obj['archived']; // keep archived
  }

  for (let path of fields) {
    if (path in obj) newObj[path] = obj[path];
  }
  //console.log("***newObj: ", newObj);
  return newObj;
};

const resultReducerForView = function (result, viewStr) {
  if (!viewStr) {
    //not specified. Return everything
    return result;
  }
  if (typeof result !== 'object' || result == null) {
    //array is also object
    return result;
  }
  if (Array.isArray(result)) {
    result = result.map((obj) => objectReducerForView(obj, viewStr));
  } else {
    result = objectReducerForView(result, viewStr);
  }
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

const searchObjPatch = function (query, mraBE) {
  const searchObj = mraBE.searchObj || {};
  for (const p in searchObj) {
    query[p] = searchObj[p];
  }
  return query;
};

const processMraBE = function (mraBE, owner) {
  if (typeof mraBE !== 'object') {
    return {
      listOnlyAllowSearch: false,
    };
  }
  if (Array.isArray(mraBE.listOnlyAllowSearchOn)) {
    mraBE.listOnlyAllowSearch = true;
    mraBE.listOnlyAllowSearchOn.push('_id');

    if (owner && owner.enable) {
      if (owner.type === 'module') {
        mraBE.listOnlyAllowSearchOn.push('mmodule_name');
      } else if (owner.type === 'user') {
          if (!!owner.field) {
            mraBE.listOnlyAllowSearchOn.push(owner.field);
          } else {
            mraBE.listOnlyAllowSearchOn.push('muser_id');
          }
      }
    }

    mraBE.listOnlyAllowSearchOn = mraBE.listOnlyAllowSearchOn.filter(
      (x, idx) => mraBE.listOnlyAllowSearchOn.indexOf(x) === idx
    )
  } else {
    mraBE.listOnlyAllowSearch = false;
  }

  return mraBE;
};

const searchAllowed = function (query, mraBE) {
  //TODO: consider $and, $or type of search
  if (!mraBE.listOnlyAllowSearch) return true;
  for (let p in query) {
    if (mraBE.listOnlyAllowSearchOn.includes(p)) {
      // at least one search fields available
      return true;
    }
  }
  return false;
};

const processPages = function (
  __per_page,
  __page,
  PER_PAGE,
  MAX_PER_PAGE,
  count
) {
  if (isNaN(__per_page) || __per_page <= 0) {
    __per_page = PER_PAGE;
  } else if (__per_page > MAX_PER_PAGE) {
    __per_page = MAX_PER_PAGE;
  }
  let maxPageNum = Math.ceil(count / (__per_page * 1.0));
  if (isNaN(__page)) __page = 1;
  if (__page > maxPageNum) __page = maxPageNum;
  if (__page <= 0) __page = 1;
  let skipCount = (__page - 1) * __per_page;
  return [__per_page, __page, maxPageNum, skipCount];
};

const fieldValueSearchAllowed = function (field, mraBE) {
  const fields = mraBE.valueSearchFields || [];
  return fields.includes(field);
};

class RestController {
  constructor(options) {
    this.schema_collection = {};
    this.views_collection = {}; // views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    this.model_collection = {};
    this.populate_collection = {};
    this.owner_config = {}; // {enable: true, type: 'user | module'
    this.mraBE_collection = {};
    this.tags_collection = {};
    this.mddsProperties = options || {};
  }

  loadContextVarsByName(name) {
    const schema = this.schema_collection[name];
    const model = this.model_collection[name];
    const views = this.views_collection[name];
    const populates = this.populate_collection[name];
    const owner = this.owner_config[name];
    const mraBE = this.mraBE_collection[name];
    if (!schema || !model || !views || !populates || !owner || !mraBE) {
      throw createError(500, 'Cannot load context from name ' + name);
    }
    return { name, schema, model, views, populates, owner, mraBE };
  }

  loadContextVars(req) {
    //let url = req.originalUrl
    //let arr = url.split('/');
    //if (arr.length < 2) throw(createError(500, "Cannot identify context name from routing path: " + url))
    //let name = arr[arr.length-2].toLowerCase();

    let name = req.meanRestSchemaName.toLowerCase();
    return this.loadContextVarsByName(name);
  }

  getPopulatesRefFields(ref) {
    let views = this.views_collection[ref.toLowerCase()]; //view registered with lowerCase
    if (!views) return null;
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    return [views[5], views[0]]; //indexView and birefView. Brief view is for association population
  }

  register(
    schemaName,
    schema,
    views,
    model,
    moduleName,
    ownerConfig,
    mraBE,
    tags
  ) {
    let name = schemaName.toLowerCase();
    this.schema_collection[name] = schema;
    this.views_collection[name] = views;
    this.model_collection[name] = model;
    this.owner_config[name] = ownerConfig;
    this.mraBE_collection[name] = processMraBE(mraBE, ownerConfig);
    this.tags_collection[name] = tags; // schema tags for special logic handling
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    this.populate_collection[name] = {
      //populates in a array, each populate is an array, too, with [field, ref]
      //eg: [["person", "Person"], ["comments", "Comments"]]
      briefView: getViewPopulates(schema, views[0]),
      detailView: getViewPopulates(schema, views[1]),
    };

    if (mraBE && mraBE.createObjects) {
      let cnt = 0;
      for (let obj of mraBE.createObjects) {
        model.create(obj, function (err, result) {
          if (err) {
            console.error(
              ` ～～ mraBE Initialization: failed to create object for schema ${schemaName}: `,
              err.message
            );
            return;
          }
          console.log(
            ` ～～ mraBE Initialization: create object for schema ${schemaName}: `,
            ++cnt
          );
        });
      }
    }
  }

  getModelNameByTag(tag) {
    for (let schemaName in this.tags_collection) {
      let tags = this.tags_collection[schemaName];
      if (tags && tags.includes(tag)) {
        return schemaName;
      }
    }
    return undefined;
  }

  getAll(req, res, next) {
    return this.searchAll(req, res, next, {});
  }

  async getRefObjectsFromId(req, schm, idArray) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVarsByName(schm.toLowerCase());

    let query = {
      _id: { $in: idArray.map((x) => mongoose.Types.ObjectId(x)) },
    };
    query = ownerPatch(query, owner, req);
    query = searchObjPatch(query, mraBE);
    if (!searchAllowed(query, mraBE)) {
      throw new Error('Search not allowed.');
    }

    try {
      let docs = await model.find(query).exec();
      return docs;
    } catch (err) {
      throw err;
    }
  }
  async getRefObjectsAll(req, schm) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVarsByName(schm.toLowerCase());

    let query = {};
    query = ownerPatch(query, owner, req);
    query = searchObjPatch(query, mraBE);
    if (!searchAllowed(query, mraBE)) {
      throw new Error('Search not allowed.');
    }

    try {
      // TODO: handle large number of documents...
      let docs = await model.find(query).exec();
      return docs;
    } catch (err) {
      throw err;
    }
  }

  getPopulateInfo(theView, morePopulateField) {
    const populateArray = [];
    const populateMap = {};
    theView.forEach((p) => {
      const fields = this.getPopulatesRefFields(p[1]);
      //fields is [indexFields, briefFieds]
      if (fields != null) {
        //only push when the ref schema is found
        populateArray.push({ path: p[0], select: fields[0] }); //let's use indexFields for now
        populateMap[p[0]] = morePopulateField === p[0] ? fields[1] : fields[0]; // use briefFields, or indexFields
      }
    });
    return [populateArray, populateMap];
  }

  // Handling other MddsActins post request
  // 1. /mddsaction/emailing
  // 2. /mddsaction/export
  async PostActionsAll(req, res, next, actionType) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return next(createError(400, 'Bad document in body.'));
      }
    }

    if (actionType === '/mddsaction/emailing') {
      try {
        emailAllCheckExternal(req, this);
      } catch (err) {
        return next(err);
      }
    } else if (actionType === '/mddsaction/export') {
    } else {
      return next(createError(400, `Action ${actionType} not supported.`));
    }

    const searchContext = body ? body.search : {};

    let rows = [];
    let emailAllResult = { success: 0, fail: 0, queuing: 0, error: null };

    const PER_PAGE = 400; //query 400 each time. SES limit is 500;
    for (let p = 1; ; p++) {
      req.query['__page'] = String(p);
      req.query['__per_page'] = String(PER_PAGE);
      let output;
      try {
        const [o, items] = await this.searchAllExec(req, searchContext);
        output = o;
        output.items = items; // un-reduced items
      } catch (err) {
        //handle DB query error
        if (actionType === '/mddsaction/export') {
          return next(err);
        } else if (actionType === '/mddsaction/emailing') {
          return emailAllErrorExternal(req, res, next, emailAllResult, err);
        }
      }

      rows = rows.concat(output.items);

      // handle each search chunk
      if (actionType === '/mddsaction/emailing') {
        try {
          let result = await this.emailAll(req, output.items);
          emailAllResult.success += result.success;
          emailAllResult.fail += result.fail;
          emailAllResult.queuing += result.queuing;
          emailAllResult.error = result.error;
        } catch (err) {
          return emailAllErrorExternal(req, res, next, emailAllResult, err);
        }
      }
      let { page, total_pages, total_count } = output;
      if (page === total_pages) {
        //done all query
        break;
      }
    }

    // handle all chunk;
    if (actionType === '/mddsaction/export') {
      return this.exportAll(req, res, next, rows);
    } else if (actionType === '/mddsaction/emailing') {
      return res.send(emailAllResult);
    }
    return next(createError(400, `Action ${actionType} not supported.`));
  }

  async emailAll(req, rows) {
    return await emailAllExternal(req, rows, this);
  }

  exportAll(req, res, next, rows) {
    return exportAllExternal(req, res, next, rows, this);
  }

  async searchAllExec(req, searchContext) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);

    let query = {};
    //get the query parameters ?a=b&c=d, but filter out unknown ones
    const PER_PAGE = 25,
      MAX_PER_PAGE = 1000;
    let __page = 1;
    let __per_page = PER_PAGE;
    let __sort, __order;
    let __categoryBy,
      __categoryProvided,
      __listCategoryShowMore,
      __categoryCand;
    let __categoryBy2,
      __categoryProvided2,
      __listCategoryShowMore2,
      __categoryCand2;
    let __asso;
    for (let prop in req.query) {
      if (prop === '__page') {
        __page = parseInt(req.query[prop]);
      } else if (prop === '__per_page') {
        __per_page = parseInt(req.query[prop]);
      } else if (prop === '__sort') {
        __sort = req.query[prop];
      } else if (prop === '__order') {
        __order = req.query[prop];
      } else if (prop === '__categoryBy') {
        __categoryBy = req.query[prop];
      } else if (prop === '__listCategoryShowMore') {
        __listCategoryShowMore = req.query[prop];
      } else if (prop === '__categoryCand') {
        __categoryCand = req.query[prop];
      } else if (prop === '__categoryProvided') {
        __categoryProvided = req.query[prop];
      } else if (prop === '__categoryBy2') {
        __categoryBy2 = req.query[prop];
      } else if (prop === '__listCategoryShowMore2') {
        __listCategoryShowMore2 = req.query[prop];
      } else if (prop === '__categoryCand2') {
        __categoryCand2 = req.query[prop];
      } else if (prop === '__categoryProvided2') {
        __categoryProvided2 = req.query[prop];
      } else if (prop === '__asso') {
        __asso = req.query[prop];
      } else if (prop in schema.paths) {
        query[prop] = req.query[prop];
      }
    }

    let __categoryFieldRef, __categoryFieldRef2;
    for (let p of populates.briefView) {
      //an array, with [field, ref]
      if (p[0] === __categoryBy) {
        __categoryFieldRef = p[1];
      } else if (p[0] === __categoryBy2) {
        __categoryFieldRef2 = p[1];
      }
    }

    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    const briefView = views[0];

    // __asso will be populated with brief view
    const [populateArray, populateMap] = this.getPopulateInfo(
      populates.briefView,
      __asso
    );

    let count = 0;
    if (searchContext) {
      //console.log("searchContext is ....", searchContext);
      // searchContext ={'_id': xxx, '$and': [{'$or', []},{'$and', []}]}
      let searchQuery = searchContext;
      if (searchContext._id) {
        searchQuery = {_id: searchContext._id};
      } else if (searchContext['$and']) {
        for (let subContext of searchContext['$and']) {
          if ('$or' in subContext) {
            if (subContext['$or'].length == 0) subContext['$or'] = [{}];
            subContext['$or'] = subContext['$or'].map((x) => createRegex(x));
          } else if ('$and' in subContext) {
            if (subContext['$and'].length == 0) subContext['$and'] = [{}];
            subContext['$and'] = subContext['$and'].map((x) =>
              checkAndSetValue(x, schema)
            );
          }
        }
      }
      //merge the url query and body query
      query = searchQuery;
      //console.log("query is ....", query['$and'][0]['$or'], query['$and'][1]['$and']);
    }
    query = ownerPatch(query, owner, req);
    query = searchObjPatch(query, mraBE);
    if (!searchAllowed(query, mraBE)) {
      throw new Error('Search not allowed.');
    }

    let originCategoriesAll = [[], []];
    let categoriesAll = [[], []]; // all reference documents that are used by this model
    let categoriesDocumentsAll = [[], []]; // all documents from referenc collection (used and not used)
    let categoriesCounts = [[], []]; // document counts based on categories
    let categoryObjectsIndexAll = [[], []];
    let categoryObjectsBriefAll = [[], []];
    let categoryObjectsAll = [[], []];

    const cateDef = [
      {
        categoryBy: __categoryBy,
        categoryProvided: __categoryProvided,
        categoryFieldRef: __categoryFieldRef,
        listCategoryShowMore: __listCategoryShowMore,
        categoryCand: __categoryCand,
      },
      {
        categoryBy: __categoryBy2,
        categoryProvided: __categoryProvided2,
        categoryFieldRef: __categoryFieldRef2,
        listCategoryShowMore: __listCategoryShowMore2,
        categoryCand: __categoryCand2,
      },
    ];
    for (let i = 0; i < cateDef.length; i++) {
      const cate = cateDef[i];
      if (cate.categoryBy && !cate.categoryProvided) {
        // need to query DB to get the category first.
        try {
          let catQuery = {};
          catQuery = ownerPatch(catQuery, owner, req);
          catQuery = searchObjPatch(catQuery, mraBE);
          if (!searchAllowed(catQuery, mraBE)) {
            throw new Error('Search not allowed.');
          }

          originCategoriesAll[i] = await model
            .find(catQuery)
            .distinct(cate.categoryBy)
            .exec(); // returns array of distinct field values. Value is unwinded for array type.

          const aggregatePipes = [
            { $match: catQuery },
            { $unwind: `$${cate.categoryBy}` }, // support array field
            { $group: { _id: `$${cate.categoryBy}`, count: { $sum: 1 } } },
          ];
          let cateCounts = await model.aggregate(aggregatePipes).exec();
          cateCounts = JSON.parse(JSON.stringify(cateCounts));
          const cateCountsObj = {};
          for (const c of cateCounts) {
            let k = c['_id'];
            if (k === null) coninue; // ignore null field; k = MddsUncategorized;
            cateCountsObj[k] = c['count'];
          }
          /*[ { _id: 5de16d0db8c1b52671ff717f, count: 1 },
              { _id: null, count: 64 },
              { _id: 5de17192518aa428ae761e70, count: 1 } ]*/

          // Order based on alphebetic
          originCategoriesAll[i].sort();
          if (i === 1) {
            // reverse (eg: time based.)
            originCategoriesAll[i].reverse();
          }

          categoriesAll[i] = originCategoriesAll[i];
          if (cate.categoryFieldRef) {
            // it's an ref field
            categoriesAll[i] = await this.getRefObjectsFromId(
              req,
              cate.categoryFieldRef,
              originCategoriesAll[i]
            );
            categoriesDocumentsAll[i] = await this.getRefObjectsAll(
              req,
              cate.categoryFieldRef
            );

            const tempIds = categoriesAll[i].map((x) => x['_id'].toString());
            categoriesDocumentsAll[i] = categoriesDocumentsAll[i].filter(
              (x) => !tempIds.includes(x['_id'].toString())
            ); // remove duplicate ones

            categoriesAll[i] = categoriesAll[i].concat(
              categoriesDocumentsAll[i]
            ); // merge
          }

          // categoriesAll could be ref object, or just simple value. Put it to parent objects.
          categoryObjectsAll[i] = categoriesAll[i].map((x) => {
            const obj = {};
            obj[cate.categoryBy] = x;
            return obj;
          });

          categoryObjectsAll[i] = JSON.parse(
            JSON.stringify(categoryObjectsAll[i])
          );
          // get the index population of the category fields
          const [indexPopulateArray, indexPopulateMap] = this.getPopulateInfo(
            populates.briefView,
            null
          );
          categoryObjectsIndexAll[i] = resultReducerForRef(
            categoryObjectsAll[i],
            indexPopulateMap
          );
          // get the indexed ref objects, or just simple value if not ref.
          categoriesAll[i] = categoryObjectsIndexAll[i].map(
            (x) => x[cate.categoryBy]
          );
          if (cate.categoryFieldRef) {
            originCategoriesAll[i] = categoriesAll[i].map((x) => x['_id']);
          }
          for (const c of originCategoriesAll[i]) {
            categoriesCounts[i].push(cateCountsObj[c] || 0);
          }
          // categoriesCounts[i].push(cateCountsObj[MddsUncategorized] || 0);

          if (i === 0) {
            /*
            let totalCnt = 0;
            for (let j = 0; j < categoriesCounts[i].length; j++) {
              totalCnt += categoriesCounts[i][j];
            }
            // put total cnt in front.
            categoriesCounts[i].splice(0, 0, totalCnt);
            */
            let totalCnt = await model.countDocuments(catQuery).exec(); // returns array of distinct field values. Value is unwinded for array type.
            categoriesCounts[i].splice(0, 0, totalCnt);
          }

          catQuery[cate.categoryBy] = { $in: [null, []] };
          let uncategorizedCnt = await model.countDocuments(catQuery).exec(); // returns array of distinct field values. Value is unwinded for array type.
          categoriesCounts[i].push(uncategorizedCnt);

          // get the biref population of the category fields
          if (cate.listCategoryShowMore) {
            const [briefPopulateArray, briefPopulateMap] = this.getPopulateInfo(
              populates.briefView,
              cate.categoryBy
            );
            categoryObjectsBriefAll[i] = resultReducerForRef(
              categoryObjectsAll[i],
              briefPopulateMap
            ).map((x) => x[cate.categoryBy]); // put only the biref-ed ref or simple value
          }

          // db.someCollection.aggregate([{ $match: { age: { $gte: 21 }}}, {"$group" : {_id:"$source", count:{$sum:1}}} ])
        } catch (err) {
          throw err;
        }
      }

      if (!cate.categoryProvided && originCategoriesAll[i].length > 0) {
        // user get a link, it has cateory Candidate, but no categoryProvided
        if (originCategoriesAll[i].includes(cate.categoryCand)) {
          // candidate found
          query[cate.categoryBy] = cate.categoryCand;
        } else if (cate.categoryCand === MddsUncategorized) {
          // uncategorized request from front end. use null.
          // query[cate.categoryBy] = null;
          query[cate.categoryBy] = { $in: [null, []] };
        } else {
          if (i === 0) {
            // Search all. don't put to query
            // do nothing
          } else {
            // take the first category as query filter
            query[cate.categoryBy] = originCategoriesAll[i][0];
          }
        }
      }
    }

    try {
      count = await model.countDocuments(query).exec();
    } catch (err) {
      throw err;
    }

    const [perPage, pageNum, maxPageNum, skipCount] = processPages(
      __per_page,
      __page,
      PER_PAGE,
      MAX_PER_PAGE,
      count
    );

    let srt = {};
    if (__sort && __order) srt[__sort] = __order;
    //let dbExec = model.find(query, briefView)

    let dbExec = model
      .find(query) //return every thing for the document
      .sort(srt)
      .skip(skipCount)
      .limit(perPage);
    for (let pi = 0; pi < populateArray.length; pi++) {
      let p = populateArray[pi];
      //dbExec = dbExec.populate(p);
      dbExec = dbExec.populate(p.path); //only give the reference path. return everything
    }

    try {
      let result = await dbExec.exec();

      let output = {
        total_count: count,
        total_pages: maxPageNum,
        page: pageNum,
        per_page: perPage,
        items: result,
        categoryBy: __categoryBy,
        categories: categoryObjectsIndexAll[0],
        categoriesCounts: categoriesCounts[0],
        categoriesBrief: categoryObjectsBriefAll[0],
        categoryBy2: __categoryBy2,
        categories2: categoryObjectsIndexAll[1],
        categoriesCounts2: categoriesCounts[1],
        categoriesBrief2: categoryObjectsBriefAll[1],
      };
      output = JSON.parse(JSON.stringify(output));

      const items = output.items;
      output.items = resultReducerForRef(output.items, populateMap);
      output.items = resultReducerForView(output.items, briefView);

      return [output, items];
    } catch (err) {
      throw err;
    }
  }

  async searchAll(req, res, next, searchContext) {
    try {
      const [output, items] = await this.searchAllExec(req, searchContext);
      return res.send(output);
    } catch (err) {
      return next(err);
    }
  }

  async searchFieldValues(req, res, next, fieldValueSearch) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format

    let query = {};
    //get the query parameters ?a=b&c=d, but filter out unknown ones
    let __field;
    let __field_value;
    const MAX_LIMIT = 1000;
    let __limit = 25;
    const sortValues = ['count', 'value']; // sort based on count, or field value
    let __sort = 'count'; // default: sort based on count
    for (let prop in req.query) {
      if (prop === '__field') {
        __field = req.query[prop];
      } else if (prop === '__field_value') {
        __field_value = req.query[prop];
      } else if (prop === '__limit') {
        let lmt = parseInt(req.query[prop]);
        __limit =
          isNaN(lmt) || lmt <= 0 ? __limit : lmt > MAX_LIMIT ? MAX_LIMIT : lmt;
      } else if (prop === '__sort') {
        let srt = req.query[prop];
        __sort = sortValues.includes(srt) ? srt : __sort;
      }
    }
    if (!__field) {
      return next(createError(400, 'Field is not provided'));
    }
    if (!fieldValueSearchAllowed(__field, mraBE)) {
      return next(
        createError(400, `Field value search for '${__field}' is now allowed`)
      );
    }

    let catQuery = {};
    let fieldQuery = {};
    if (__field_value) {
      const v = createRegex(__field_value);
      catQuery[__field] = v;
      fieldQuery['_id'] = v;
    }
    let sortO = { count: -1 };
    if (__sort === 'value') {
      sortO = { _id: 1 };
    }

    catQuery = ownerPatch(catQuery, owner, req);
    catQuery = searchObjPatch(catQuery, mraBE);
    if (!searchAllowed(query, mraBE)) {
      return next(
        createError(400, `Search not allowed`)
      );
    }

    const aggregatePipes = [
      { $match: catQuery },
      { $unwind: `$${__field}` }, // unwind will unpack the array, if field is of type array.
      { $group: { _id: `$${__field}`, count: { $sum: 1 } } }, // group and sum
      { $match: fieldQuery }, // pick fields matching the given field value;
      { $sort: sortO },
      { $limit: __limit },
    ];
    // count for each value
    let cateCounts = await model.aggregate(aggregatePipes).exec();
    cateCounts = JSON.parse(JSON.stringify(cateCounts));
    return res.send(cateCounts);
  }

  getSamples(req, res, next, searchContext) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    const briefView = views[0];

    const [populateArray, populateMap] = this.getPopulateInfo(
      populates.briefView,
      null
    );

    let query = {};
    //get the query parameters ?a=b&c=d, but filter out unknown ones
    const PER_PAGE = 25,
      MAX_PER_PAGE = 1000;
    let __page = 1;
    let __per_page = PER_PAGE;
    for (let prop in req.query) {
      if (prop === '__page') __page = parseInt(req.query[prop]);
      else if (prop === '__per_page') __per_page = parseInt(req.query[prop]);
      else if (prop in schema.paths) {
        query[prop] = req.query[prop];
      }
    }
    let count = 0;
    if (searchContext) {
      //console.log("searchContext is ....", searchContext);
      // searchContext ={'$and', [{'$or', []},{'$and', []}]}
      if (searchContext['$and']) {
        for (let subContext of searchContext['$and']) {
          if ('$or' in subContext) {
            if (subContext['$or'].length == 0) subContext['$or'] = [{}];
            subContext['$or'] = subContext['$or'].map((x) => createRegex(x));
          } else if ('$and' in subContext) {
            if (subContext['$and'].length == 0) subContext['$and'] = [{}];
            subContext['$and'] = subContext['$and'].map((x) =>
              checkAndSetValue(x, schema)
            );
          }
        }
      }
      //merge the url query and body query
      query = searchContext;
      //console.log("query is ....", query['$and'][0]['$or'], query['$and'][1]['$and']);
    }
    query = ownerPatch(query, owner, req);
    query = searchObjPatch(query, mraBE);
    if (!searchAllowed(query, mraBE)) {
      return next(
        createError(400, `Search not allowed`)
      );
    }
    model.countDocuments(query).exec(function (err, cnt) {
      if (err) {
        return next(err);
      }
      count = cnt;
      const [perPage, pageNum, maxPageNum, skipCount] = processPages(
        __per_page,
        __page,
        PER_PAGE,
        MAX_PER_PAGE,
        count
      );

      //let dbExec = model.find(query, briefView)
      let dbExec = model
        .find(query) //return every thing for the document
        .skip(skipCount)
        .limit(perPage);
      for (let pi = 0; pi < populateArray.length; pi++) {
        let p = populateArray[pi];
        //dbExec = dbExec.populate(p);
        dbExec = dbExec.populate(p.path); //only give the reference path. return everything
      }
      dbExec.exec(function (err, result) {
        if (err) return next(err);
        let output = {
          total_count: count,
          total_pages: maxPageNum,
          page: pageNum,
          per_page: perPage,
          items: result,
        };
        output = JSON.parse(JSON.stringify(output));
        output.items = resultReducerForRef(output.items, populateMap);
        output.items = resultReducerForView(output.items, briefView);
        return res.send(output);
      });
    });
  }

  async getDetailsByIdExec(req) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    /*
    let action = "";
    if (req.query) {
      action = req.query['action'];
    }
    */
    let originalUrl = req.originalUrl;
    let detailView;
    if (originalUrl.includes('/mddsaction/post')) {
      detailView = views[3]; //return based on edit view
    } else {
      detailView = views[1];
    }

    const [populateArray, populateMap] = this.getPopulateInfo(
      populates.detailView,
      null
    );

    let idParam = name + 'Id';
    let id = req.params[idParam];
    //let dbExec = model.findById(id, detailView)
    let dbExec = model.findById(id); //return every thing for the document

    for (let pi = 0; pi < populateArray.length; pi++) {
      let p = populateArray[pi];
      //dbExec = dbExec.populate(p);
      dbExec = dbExec.populate(p.path); //only give the reference path. return everything for reference
    }
    let result = await dbExec.exec();

    result = JSON.parse(JSON.stringify(result));
    let reducedResult = resultReducerForRef(result, populateMap);
    reducedResult = resultReducerForView(reducedResult, detailView);
    return [reducedResult, result];
  }

  async getDetailsById(req, res, next) {
    try {
      let [reducedResult, result] = await this.getDetailsByIdExec(req);
      return res.send(reducedResult);
    } catch (err) {
      return next(err);
    }
  }

  HardDeleteById(req, res, next) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    let idParam = name + 'Id';
    let id = req.params[idParam];
    model.findByIdAndDelete(id).exec((err, result) => {
      if (err) {
        return next(err);
      }
      this.handleHooks('delete', result, mraBE);
      return res.send();
    });
  }

  async deleteManyByIds(req, res, next, ids) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    let query = { _id: { $in: ids } };
    let docs = [];
    if (this.hasHooks('delete', mraBE)) {
      try {
        docs = await model.find(query).exec();
      } catch (err) {
        console.error('query docs faied ', err);
      }
    }
    model.deleteMany(query).exec((err, results) => {
      if (err) {
        return next(err);
      }
      for (let doc of docs) {
        this.handleHooks('delete', doc, mraBE);
      }
      return res.send();
    });
  }
  archiveManyByIds(req, res, next, ids) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    model.archive({ _id: { $in: ids } }, function (err, result) {
      if (err) {
        return next(err);
      }
      return res.send();
    });
  }
  unarchiveManyByIds(req, res, next, ids) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    model.unarchive({ _id: { $in: ids } }, function (err, result) {
      if (err) {
        return next(err);
      }
      return res.send();
    });
  }
  async CreateExec(req) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        throw createError(400, 'Bad ' + name + ' document.');
      }
    }
    body = ownerPatch(body, owner, req);
    let result = await model.create(body);
    this.handleHooks('insert', result, mraBE);
    return result;
  }

  async Create(req, res, next) {
    let result;
    try {
      result = await this.CreateExec(req);
      res.send(result);
    } catch (err) {
      return next(err);
    }
  }

  Update(req, res, next) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return next(createError(404, 'Bad ' + name + ' document.'));
      }
    }
    let idParam = name + 'Id';
    let id = req.params[idParam];
    let editViewStr = views[3];
    let viewFields = editViewStr.match(/\S+/g) || [];
    if (schema.options.useSaveInsteadOfUpdate) {
      model.findOne({ _id: id }, (err, result) => {
        if (err) {
          return next(err);
        }

        let mapFields = {};
        let hasMap = false;
        for (let field in body) {
          let income = body[field];

          let existing = result[field];
          if (existing instanceof Map) {
            // first remove the map filed, and save it for later update.
            mapFields[field] = income;
            income = undefined;
            hasMap = true;
          }

          //all fields from client
          result[field] = income;
        }
        for (let field of viewFields) {
          if (!(field in body)) {
            //not in body means user deleted this field
            // delete result[field]
            result[field] = undefined;
          }
        }
        result = ownerPatch(result, owner, req);
        result.save((err) => {
          if (err) {
            return next(err);
          }
          // put map fields to the result
          for (let field in mapFields) {
            result[field] = mapFields[field];
          }
          if (!hasMap) {
            this.handleHooks('update', result, mraBE);
            return res.send();
          }
          // update second time for the map field.
          // Use update for performance (assume map fields don't need save hooks)
          model.updateOne({ _id: id }, mapFields, (err) => {
            if (err) {
              return next(err);
            }
            this.handleHooks('update', result, mraBE);
            return res.send();
          });
        });
      });
    } else {
      //all top-level update keys that are not $atomic operation names are treated as $set operations
      model.updateOne({ _id: id }, body, (err, result) => {
        if (err) {
          return next(err);
        }
        this.handleHooks('update', result, mraBE);
        return res.send();
      });
    }
  }

  PostActions(req, res, next) {
    /*
    if (req.query) {
        action = req.query['action'];
    }
    */
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return next(createError(400, 'Bad document in body.'));
      }
    }
    let action = req.path;
    let ids;
    switch (action) {
      case '/mddsaction/delete':
        ids = body;
        this.deleteManyByIds(req, res, next, ids);
        break;
      case '/mddsaction/archive':
        ids = body;
        this.archiveManyByIds(req, res, next, ids);
        break;
      case '/mddsaction/unarchive':
        ids = body;
        this.unarchiveManyByIds(req, res, next, ids);
        break;
      case '/mddsaction/getfieldvalues':
        let fieldValueSearch = body ? body.fieldValueSearch : {};
        this.searchFieldValues(req, res, next, fieldValueSearch);
        break;
      case '/mddsaction/get':
        let searchContext = body ? body.search : {};
        this.searchAll(req, res, next, searchContext);
        break;
      default:
        if (action.startsWith('/mddsaction/')) {
          this.PostActionsAll(req, res, next, action);
        } else {
          return next(createError(404, 'Bad Action: ' + action));
        }
    }
  }

  zInterfaceCall(req, res, next) {
    if (!req.zInterface) {
      return next(createError(400, 'Bad Request: interface not defined'));
    }
    let ifname = req.zInterface.name;
    let action = req.zInterface.action;
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);

    if (!mraBE || !mraBE.zInterfaces || !mraBE.zInterfaces[action]) {
      return next(
        createError(
          400,
          `Bad Request: ${action} interface not defined: ${ifname}`
        )
      );
    }
    const targetInterfaces = mraBE.zInterfaces[action].filter((x) => {
      if (x.name === ifname) return true;
      return false;
    });
    if (targetInterfaces.length === 0) {
      return next(
        createError(
          400,
          `Bad Request: ${action} interface not defined: ${ifname}`
        )
      );
    }
    const fn = targetInterfaces[0].fn;
    return fn(req, res, next, this);
  }

  //Return a promise.
  ModelExecute(modelName, apiName, ...params) {
    const modelname = modelName.toLowerCase();
    let model = this.model_collection[modelname];
    if (!model || !model[apiName]) {
      let err = new Error(
        `model ${modelname} or mode API ${apiName} doesn't exit`
      );
      return new Promise(function (resolve, reject) {
        reject(err);
      });
    }
    // For APIs that return Promise
    if (apiName == 'create') {
      return model.create.apply(model, params);
    } else if (apiName == 'insertMany') {
      return model.insertMany.apply(model, params);
    }

    // For APIs that return Query
    let dbExe = model[apiName].apply(model, params);
    return dbExe.exec();
  }
  ModelExecute2(modelName, apis) {
    const modelname = modelName.toLowerCase();
    let model = this.model_collection[modelname];
    if (!model) {
      let err = new Error(
        `model ${modelname} or mode API ${apiName} doesn't exit`
      );
      return new Promise(function (resolve, reject) {
        reject(err);
      });
    }
    let dbExe;
    for (let item of apis) {
      let apiName = item[0];
      let apiArgs = item[1];
      try {
        if (!dbExe) dbExe = model[apiName].apply(model, apiArgs);
        else dbExe = dbExe[apiName].apply(dbExe, apiArgs);
      } catch (err) {
        return new Promise(function (resolve, reject) {
          reject(err);
        });
      }
    }
    return dbExe.exec();
  }

  async handleHooks(action, data, mraBE) {
    //action: insert, update

    const restController = this;

    // 1. check emailer hooks
    const { emailer, emailerObj } = this.mddsProperties || {};
    if (emailer) {
      const emailerConf = mraBE.emailer || {};
      const replacement = emailerConf.replacement || {};
      const emailHooks = emailerConf.hooks || {};
      if (emailHooks[action]) {
        emailHooks[action](
          emailer,
          data,
          replacement,
          emailerObj,
          restController
        );
      }
    }

    // 2. check .... hooks
    const hooks = mraBE.hooks || {};
    if (hooks[action]) {
      let hooksArr = hooks[action];
      if (!Array.isArray(hooksArr)) {
        hooksArr = [hooks[action]];
      }
      for (let func of hooksArr) {
        func(data, restController);
      }
    }
  }
  hasHooks(action, mraBE) {
    // 1. check emailer hooks
    const { emailer, emailerObj } = this.mddsProperties || {};
    if (emailer) {
      const emailerConf = mraBE.emailer || {};
      const emailHooks = emailerConf.hooks || {};
      if (emailHooks[action]) {
        return true;
      }
    }
    // 2. check .... hooks
    const hooks = mraBE.hooks || {};
    if (hooks[action]) {
      return true;
    }
    return false;
  }
}

module.exports = RestController;
