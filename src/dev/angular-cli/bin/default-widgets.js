const defaultListWidgets = {
  general: {
    views: ['list', 'grid', 'table'],
  },
  select: {
    views: ['list', 'grid', 'table'],
  },
  sub: {
    views: ['list', 'grid', 'table'],
  },
  association: {
    views: ['association'],
  },
};

const defaultListWidgetTypes = {
    general: 'general',
    select: 'select',
    sub: 'sub',
    association: 'association',
};

const listExtraWidgets = [];



function setListViewProperties(viewType, listViewObj) {
  const properties = [
    'clickItemAction',
    'cardHasLink',
    'cardHasSelect',
    'includeSubDetail',

    'canUpdate',
    'canDelete',
    'canArchive',
    'canCheck',
    'itemMultiSelect',
  
    'majorUi',
  ];
  let options = {};
  switch(viewType) {
    case 'general':
      options = {
        itemMultiSelect: true,
        majorUi: true,
      };
      break;
    case 'sub':
      options = {
        itemMultiSelect: true,
        canDelete: false,
        canArchive: false,
        canCheck: false,
        majorUi: true,
      };
      break;
    case 'select':
      options = {
        clickItemAction: '',
        itemMultiSelect: false,
        cardHasLink: false,
        cardHasSelect: true,
        canUpdate: false,
        canDelete: false,
        canArchive: false,
        canCheck: false,
        majorUi: false,
      };
      break;
    case 'association':
      options = {
        clickItemAction: '',
        itemMultiSelect: false,
        cardHasLink: false,
        cardHasSelect: false,
        canUpdate: false,
        canDelete: false,
        canArchive: false,
        canCheck: false,
        includeSubDetail: false,
        majorUi: true,
      };
      break;
  }
  for (let p of properties) {
    if (typeof options[p] !== 'undefined') {
      listViewObj[p] = options[p];
    }
  }
  return listViewObj;
}

module.exports = {
    defaultListWidgets,
    defaultListWidgetTypes,

    setListViewProperties,
}