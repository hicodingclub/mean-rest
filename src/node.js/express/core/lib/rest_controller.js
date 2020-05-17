const createError = require('http-errors');
const mongoose = require('mongoose');

const MddsUncategorized = 'MddsUncategorized';
const MddsAll = 'MddsAll';

const createRegex = function (obj) {
  //obj in {key: string} format
  for (let prop in obj) {
    let userInput = obj[prop];
    obj[prop] = new RegExp(
      // Escape all special characters except *
      userInput
        .replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1')
        .replace(/\*/g, '.*'), // Allow the use of * as a wildcard like % in SQL.
      'i'
    );
  }
  return obj;
};

var capitalizeFirst = function (str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

var lowerFirst = function (str) {
  return str.charAt(0).toLowerCase() + str.substr(1);
};

var camelToDisplay = function (str) {
  // insert a space before all caps
  words = [
    'At',
    'Around',
    'By',
    'After',
    'Along',
    'For',
    'From',
    'Of',
    'On',
    'To',
    'With',
    'Without',
    'And',
    'Nor',
    'But',
    'Or',
    'Yet',
    'So',
    'A',
    'An',
    'The',
  ];
  let arr = str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .match(/\S+/g);
  arr = arr.map((x) => {
    let y = capitalizeFirst(x);
    if (words.includes(y)) y = lowerFirst(y);
    return y;
  });
  return capitalizeFirst(arr.join(' '));
};

function getFieldValue(field) {
  let t = typeof field;
  switch (t) {
    case 'string':
    case 'boolean':
    case 'number':
      return String(field);
      break;
    case 'object':
      if (Array.isArray(field)) {
        let v = '';
        for (let f of field) {
          v += getFieldObject(f) + ' ';
        }
        return v;
      }
      let v = '';
      for (let f in field) {
        v += getFieldObject(field[f]);
      }
      return v;
      break;
    default:
      return '';
  }
}

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
        } else if (typeof obj[item] == 'object') {
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
      } else if (type == 'SchemaString') {
        let userInput = obj[item];

        if (userInput) {
          userInput = new RegExp(
            // Escape all special characters
            userInput.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'),
            'i'
          );
        }

        obj[item] = userInput;
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
  console.log('=== searchObj', searchObj);
  for (const p in searchObj) {
    query[p] = searchObj[p];
  }
  return query;
}

class RestController {
  constructor(options) {
    this.schema_collection = {};
    this.views_collection = {}; // views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    this.model_collection = {};
    this.populate_collection = {};
    this.owner_config = {}; // {enable: true, type: 'user | module'
    this.mraBE_collection = {};
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

  register(schemaName, schema, views, model, moduleName, ownerConfig, mraBE) {
    let name = schemaName.toLowerCase();
    this.schema_collection[name] = schema;
    this.views_collection[name] = views;
    this.model_collection[name] = model;
    this.owner_config[name] = ownerConfig;
    this.mraBE_collection[name] = mraBE;
    //views in [briefView, detailView, CreateView, EditView, SearchView, IndexView] format
    this.populate_collection[name] = {
      //populates in a array, each populate is an array, too, with [field, ref]
      //eg: [["person", "Person"], ["comments", "Comments"]]
      briefView: getViewPopulates(schema, views[0]),
      detailView: getViewPopulates(schema, views[1]),
    };
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

  async PostActionsAll(req, res, next, actionType) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return next(createError(400, 'Bad document in body.'));
      }
    }
    const searchContext = body ? body.search : {};

    let rows = [];

    const PER_PAGE = 500; //query 1000 each time
    for (let p = 1; ; p++) {
      req.query['__page'] = String(p);
      req.query['__per_page'] = String(PER_PAGE);
      try {
        let output = await this.searchAll(req, res, next, searchContext, true); // set furtherAction parameter to true
        if (!output.page) {
          // not expected result. must be next() called by searchAll. Just return it.
          return output;
        }
        rows = rows.concat(output.items);

        let { page, total_pages, total_count } = output;
        if (page === total_pages) {
          //done all query
          break;
        }
      } catch (err) {
        return next(err);
      }
    }

    if (actionType === '/mddsaction/export') {
      return this.exportAll(req, res, next, rows);
    }
    if (actionType === '/mddsaction/emailing') {
      return this.emailAll(req, res, next, rows);
    }
    return next(createError(400, `Action ${actionType} not supported.`));
  }

  async emailAll(req, res, next, rows) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return next(createError(400, 'Bad document in body.'));
      }
    }
    const actionData = body ? body.actionData : {};

    const {
      emailInput,
      emailTemplate,
      subject,
      content,
      emailFields,
    } = actionData;

    let badRequest = false;
    if (emailInput === 'template') {
      if (!emailTemplate) {
        badRequest = true;
      }
    } else if (emailInput === 'compose') {
      if (!subject || !content) {
        badRequest = true;
      }
    } else {
      badRequest = true;
    }

    if (badRequest) {
      return next(createError(400, 'Bad action data for emailing'));
    }

    const { emailer, emailerObj } = this.mddsProperties || {};

    if (!emailer) {
      return next(createError(503, 'Emailing service is not available'));
    }

    const recipients = [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < emailFields.length; j++) {
        const emailField = emailFields[j];
        const eml = rows[i][emailField];
        if (eml) {
          recipients.push(eml);
        }
      }
    }

    // filter emails and send
    try {
      let result;
      if (emailInput === 'template') {
        result = await emailer.sendEmailTemplate(
          recipients,
          emailTemplate,
          emailerObj || {}
        );
      } else {
        result = await emailer.sendEmail(
          undefined,
          recipients,
          subject,
          content
        );
      }
      // result: {success: 1, fail: 0, errors: []}
      const err =
        result.errors[0] || new Error(`Email send failed: unknown error.`);
      if (result.success > 0) {
        return res.send({
          success: result.success,
          fail: result.fail,
          error: err,
        });
      }
      return next(err);
    } catch (err2) {
      return next(err2);
    }
  }

  exportAll(req, res, next, rows) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);

    let __asso = req.query['__asso'] || undefined;
    let __ignore = req.query['__ignore'] || undefined;

    const briefView = views[0];

    //header field name for exported
    let headers = briefView.split(' ');
    let assoHeaders;
    if (__asso) {
      for (let p of populates.briefView) {
        //an array, with [field, ref]
        if (p[0] === __asso) {
          let assoSchema = p[1];
          const refViews = this.getPopulatesRefFields(assoSchema);

          assoHeaders = refViews[1].split(' ');

          headers = headers.filter((x) => x !== __asso);
          break;
        }
      }
    }
    if (__ignore) {
      headers = headers.filter((x) => x !== __ignore);
    }
    let combinedHeaders = headers.concat(assoHeaders);

    let combinedRows = [];
    for (let r of rows) {
      const ro = [];

      for (let hf of headers) {
        ro.push(getFieldValue(r[hf]));
      }

      let asf = r[__asso];
      if (!Array.isArray(asf)) {
        asf = [asf];
      }
      for (let as of asf) {
        let asr = [];
        for (let af of assoHeaders) {
          asr.push(getFieldValue(as[af]));
        }
        combinedRows.push(ro.concat(asr));
      }
    }

    // console.log('combinedHeaders, ', combinedHeaders);
    // console.log('combinedRows, ', combinedRows);
    // return res.send(headers);

    const excel = require('node-excel-export');

    const styles = {
      headerGray: {
        fill: {
          fgColor: {
            rgb: 'D3D3D3FF',
          },
        },
        font: {
          color: {
            rgb: '000000FF', // Blue fount
          },
          sz: 14,
          bold: true,
          underline: true,
        },
      },
      headerDark: {
        fill: {
          fgColor: {
            rgb: 'FF000000',
          },
        },
        font: {
          color: {
            rgb: 'FFFFFFFF',
          },
          sz: 14,
          bold: true,
          underline: true,
        },
      },
      cellPink: {
        fill: {
          fgColor: {
            rgb: 'FFFFCCFF',
          },
        },
      },
      cellGreen: {
        fill: {
          fgColor: {
            rgb: 'FF00FF00',
          },
        },
      },
    };

    const heading = [[{ value: `${name}`, style: styles.headerGray }]];

    const specifications = {};
    for (let f of combinedHeaders) {
      specifications[f] = {
        displayName: f,
        headerStyle: styles.headerGray,
        width: '25', // width in chars (passed as string)
      };
    }

    const dataset = combinedRows.map((x) => {
      const obj = {};
      for (let [i, f] of combinedHeaders.entries()) {
        obj[f] = x[i];
      }
      return obj;
    });

    // Create the excel report.
    // This function will return Buffer
    const report = excel.buildExport([
      // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
      {
        name: 'Report', // <- Specify sheet name (optional)
        heading: heading, // <- Raw heading array (optional)
        // merges: merges, // <- Merge cell ranges
        specification: specifications, // <- Report specification
        data: dataset, // <-- Report data
      },
    ]);

    const fileName =
      `${name}-` + Date.now() + (Math.random() * 100).toFixed(2) + '.xlsx';

    // You can then return this straight
    res.attachment(`${fileName}`); // This is sails.js specific (in general you need to set headers)
    return res.send(report);
  }

  async searchAll(req, res, next, searchContext, furtherAction) {
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
    query = searchObjPatch(query, mraBE)

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
          catQuery = searchObjPatch(catQuery, mraBE)

          originCategoriesAll[i] = await model
            .find(catQuery)
            .distinct(cate.categoryBy)
            .exec(); // no objects

          const aggregatePipes = [
            { $match: catQuery },
            { $group: { _id: `$${cate.categoryBy}`, count: { $sum: 1 } } },
          ];
          let cateCounts = await model.aggregate(aggregatePipes).exec();
          cateCounts = JSON.parse(JSON.stringify(cateCounts));
          const cateCountsObj = {};
          for (const c of cateCounts) {
            let k = c['_id'];
            if (k === null) k = MddsUncategorized;
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
          categoriesAll[i] = categoryObjectsIndexAll[i].map(
            (x) => x[cate.categoryBy]
          );
          if (cate.categoryFieldRef) {
            originCategoriesAll[i] = categoriesAll[i].map((x) => x['_id']);
          }
          for (const c of originCategoriesAll[i]) {
            categoriesCounts[i].push(cateCountsObj[c] || 0);
          }
          categoriesCounts[i].push(cateCountsObj[MddsUncategorized] || 0);

          if (i === 0) {
            let totalCnt = 0;
            for (let j = 0; j < categoriesCounts[i].length; j++) {
              totalCnt += categoriesCounts[i][j];
            }
            // put total cnt in front.
            categoriesCounts[i].splice(0, 0, totalCnt);
          }

          // get the biref population of the category fields
          if (cate.listCategoryShowMore) {
            const [briefPopulateArray, briefPopulateMap] = this.getPopulateInfo(
              populates.briefView,
              cate.categoryBy
            );
            categoryObjectsBriefAll[i] = resultReducerForRef(
              categoryObjectsAll[i],
              briefPopulateMap
            ).map((x) => x[cate.categoryBy]);
          }

          // db.someCollection.aggregate([{ $match: { age: { $gte: 21 }}}, {"$group" : {_id:"$source", count:{$sum:1}}} ])
        } catch (err) {
          return next(err);
        }
      }

      if (!cate.categoryProvided && originCategoriesAll[i].length > 0) {
        // user get a link, it has cateory Candidate, but no categoryProvided
        if (originCategoriesAll[i].includes(cate.categoryCand)) {
          // candidate found
          query[cate.categoryBy] = cate.categoryCand;
        } else if (cate.categoryCand === MddsUncategorized) {
          // uncategorized request from front end. use null.
          query[cate.categoryBy] = null;
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
      return next(err);
    }

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
    let srt = {};
    if (__sort && __order) srt[__sort] = __order;
    //let dbExec = model.find(query, briefView)

    let dbExec = model
      .find(query) //return every thing for the document
      .sort(srt)
      .skip(skipCount)
      .limit(__per_page);
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
        page: __page,
        per_page: __per_page,
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
      if (furtherAction) {
        //return un-reduced items
        return output; // export, return data to caller;
      }

      output.items = resultReducerForRef(output.items, populateMap);
      output.items = resultReducerForView(output.items, briefView);

      return res.send(output);
    } catch (err) {
      return next(err);
    }
  }

  getFieldValues(req, res, next, fieldValueSearch) {
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
    model.countDocuments(query).exec(function (err, cnt) {
      if (err) {
        return next(err);
      }
      count = cnt;
      if (isNaN(__per_page) || __per_page <= 0) __per_page = PER_PAGE;
      else if (__per_page > MAX_PER_PAGE) __per_page = MAX_PER_PAGE;
      let maxPageNum = Math.ceil(count / (__per_page * 1.0));
      if (isNaN(__page)) __page = 1;
      if (__page > maxPageNum) __page = maxPageNum;
      if (__page <= 0) __page = 1;
      let skipCount = (__page - 1) * __per_page;
      //let dbExec = model.find(query, briefView)
      let dbExec = model
        .find(query) //return every thing for the document
        .skip(skipCount)
        .limit(__per_page);
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
          page: __page,
          per_page: __per_page,
          items: result,
        };
        output = JSON.parse(JSON.stringify(output));
        output.items = resultReducerForRef(output.items, populateMap);
        output.items = resultReducerForView(output.items, briefView);
        return res.send(output);
      });
    });
  }
  getDetailsById(req, res, next) {
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
    dbExec.exec(function (err, result) {
      if (err) {
        return next(err);
      }
      result = JSON.parse(JSON.stringify(result));
      result = resultReducerForRef(result, populateMap);
      result = resultReducerForView(result, detailView);
      return res.send(result);
    });
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
    model.findByIdAndDelete(id).exec(function (err, result) {
      if (err) {
        return next(err);
      }
      return res.send();
    });
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
      case '/mddsaction/getfieldvalue':
        let fieldValueSearch = body ? body.fieldValueSearch : {};
        this.getFieldValues(req, res, next, fieldValueSearch);
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
  deleteManyByIds(req, res, next, ids) {
    const {
      name,
      schema,
      model,
      views,
      populates,
      owner,
      mraBE,
    } = this.loadContextVars(req);
    model.deleteMany({ _id: { $in: ids } }).exec(function (err, result) {
      if (err) {
        return next(err);
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
  Create(req, res, next) {
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
        return next(createError(404, 'Bad ' + name + ' document.'));
      }
    }
    body = ownerPatch(body, owner, req);
    model.create(body, function (err, result) {
      if (err) {
        return next(err);
      }
      return res.send(result);
    });
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
      model.findOne({ _id: id }, function (err, result) {
        if (err) {
          return next(err);
        }
        for (let field in body) {
          //all fields from client
          result[field] = body[field];
        }
        for (let field of viewFields) {
          if (!(field in body)) {
            //not in body means user deleted this field
            // delete result[field]
            result[field] = undefined;
          }
        }
        result = ownerPatch(result, owner, req);
        result.save(function (err, result) {
          if (err) {
            return next(err);
          }
          return res.send();
        });
      });
    } else {
      //all top-level update keys that are not $atomic operation names are treated as $set operations
      model.updateOne({ _id: id }, body, function (err, result) {
        if (err) {
          return next(err);
        }
        return res.send();
      });
    }
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
    if (apiName == 'create') {
      return model.create(params);
    }
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
}

module.exports = RestController;
