const stripDisplayNames = function (viewStr) {
  const displayNames = {};
  const re = /([^\s\|]+)\[([^\]]*)\]/g; // handle 'field[field displayName]'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      displayNames[m[1]] = m[2];
    }
  } while (m);

  const viewStrDisplayNameHandled = viewStr.replace(/\[[^\]]*\]/g, '');

  return [displayNames, viewStrDisplayNameHandled];
};
const stripFieldHidden = function (viewStr) {
  const fieldHidden = {};
  const re = /\(([^\)]*)\)/g; // handle 'field<fieldMeta>'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      fieldHidden[m[1]] = true;
    }
  } while (m);

  const viewStrHiddenHandled = viewStr.replace(/[\(\)]/g, '');

  return [fieldHidden, viewStrHiddenHandled];
};
const stripFieldMeta = function (viewStr) {
  const fieldMeta = {};
  const re = /([^\s\|]+)<([^>]*)>/g; // handle 'field<fieldMeta>'
  const s = viewStr;
  let m;
  do {
    m = re.exec(s);
    if (m) {
      fieldMeta[m[1]] = m[2];
    }
  } while (m);

  const viewStrMetaHandled = viewStr.replace(/<[^\>]*>/g, '');

  return [fieldMeta, viewStrMetaHandled];
};

var processViewStr = function (viewStr) {
  if (!viewStr) return viewStr;

  let [tmp1, str1] = stripDisplayNames(viewStr);
  let [tmp2, str2] = stripFieldMeta(str1);
  let [tmp3, str3] = stripFieldHidden(str2);

  let arr = str3.replace(/\|/g, ' ').match(/\S+/g) || [];
  let newViewStr = arr.join(' ');

  return newViewStr;
};

module.exports = {
    processViewStr,
};