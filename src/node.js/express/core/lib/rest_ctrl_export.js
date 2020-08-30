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

function exportAllExternal(req, res, next, rows, restController) {
  const {
    name,
    schema,
    model,
    views,
    populates,
    owner,
    mraBE,
  } = restController.loadContextVars(req);

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
        const refViews = restController.getPopulatesRefFields(assoSchema);

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
      if (typeof asf === 'object') {
        asf = [asf];
      } else {
        asf = [{}]; // put an empty object
      }
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

module.exports = {
    exportAllExternal,
};