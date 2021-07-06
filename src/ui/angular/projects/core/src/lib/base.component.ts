import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Injector, ComponentFactoryResolver, EventEmitter, Type } from '@angular/core';

import { Location } from '@angular/common';

import { ModalConfig, Modal } from './util.modal';
import { SnackBarConfig, SnackBar } from './util.snackbar';
import { ErrorToastConfig, ErrorToast } from './util.errortoast';

import { MddsBaseService, MddsServiceError } from './base.service';
import { MddsCommonService } from './mdds-common.service';
import { MddsBaseComponentInterface } from './base.interface';
import { Util } from './util.tools';

export enum ViewType {
  LIST,
  DETAIL,
  EDIT,
}

export const MddsUncategorized = 'MddsUncategorized';
export const MddsAll = 'MddsAll';

export class MddsBaseComponent implements MddsBaseComponentInterface {
  public objectKeys = Object.keys;

  public storage: any = {};

  // For list and pagination
  public list: any[] = [];
  public originalList: any[] = [];

  public majorUi = true;
  public modulePath: string;
  public eventEmitter: EventEmitter<any> = new EventEmitter();

  public page = 1;
  public perPage = 25;
  public totalCount = 0;
  public totalPages = 0;

  public newPage: any;

  public pages: number[] = [];
  public leftMore = false;
  public rightMore = false;

  public checkAll = false;
  // used to mark deleted items, or items that will show sub-detail, etc.
  public checkedItem: boolean[] = [];
  public showDetailItem: boolean[] = [];

  // For edit and view details
  public detail: any = {};
  public cloneDetail: any = {}; // a clone and used to send/receive from next work
  public extraDetail: any = {}; // extra info.
  public id: string;
  public embeddedView = false; // a edit-sub component
  // for fields with enum values
  public enums: any = {};
  public stringFields = [];
  public referenceFields: string[] = [];
  public referenceFieldsMap = {}; // refField: refSchema
  public referenceFieldsReverseMap = {}; // refSchema: refField
  public dateFields = [];
  public numberFields = [];
  public indexFields = [];
  public multiSelectionFields = [];
  public arrayFields = []; // element is [fieldName, elementType, elementObj]
  public mapFields = []; // element is [fieldName, elementType, mapKey]
  public fileFields = {}; // fieldName: {selectedFiles: [selected files]}
  public textareaFields = [];
  public requiredFields = []; // collection of required fields. used by category field to check of 'other' need to present
  public emailFields = []; // [displayName, fieldName]
  public httpurlFields = []; // [fieldName, urlDisplay]
  public editHintFields = {}; // fields that need hint for their values
  public fieldDisplayNames = {}; // display names of field
  public dateFormat = 'MM/DD/YYYY';
  public timeFormat = 'hh:mm:ss';
  public datePickerDisplayMonths = 2;

  public briefFieldsInfo = []; // from base contructor. All breifFields

  public listRouterLink: string = '../../list'; //router link from detail to list; overridden by component
  public listViewFilter: string = 'table'; // list, or grid
  public listViews: string[] = [];
  public listViewProperties: any = {};
  public listSortField: string;
  public listSortFieldDisplay: string;
  public listSortOrder: string; // 'asc', 'desc'

  // {listCategoryField, listCategoryShowMore, listCategoryRef}
  // listCategoryField: field used as category; listCategoryShowMore: show more info for the category (if category is ref)
  public listCategory1: any = {}; // sub category
  public listCategory2: any = {}; // top category

  public categories = []; // stored categories
  public categoriesCounts = []; // categories counts
  public categoryMore = []; // stored more details
  public categoryDisplays: string[] = []; // stored display name of categories
  public selectedCategory: number = undefined; // index in categories

  public categories2 = []; // stored categories
  public categoriesCounts2 = []; // categories counts
  public categoryMore2 = []; // stored more details
  public categoryDisplays2: string[] = []; // stored display name of categories
  public selectedCategory2: number = undefined; // index in categories

  public urlCate1: string; // pre-set candidate category
  public urlCate2: string;

  public hiddenFields = []; // fields hide from view. Currrently used by 'Add' view of edit-sub
  public viewHiddenFields = []; // fields hidden from view. Hidden is defined in schema view with ()

  public itemCamelName: string;
  public ItemCamelName: string;
  public itemName: string;
  public parentItem: string;
  public schemaName: string;

  public refreshing = false;

  public commonService: MddsCommonService;

  public loaded = false;

  // actions (pipeline/composite)
  public dropdownSelectedIdx: number;
  public actionType: string;

  // search bar
  public searchDetailReady: boolean; // when search is provided by input data, instead of from search bar;
  public searchText: string;
  public searchMoreDetail: any;
  public moreSearchOpened = false;
  public ownSearchStringFields = []; //list of strings that should have own search field in the search area
  public stringBoxFields = []; // list of fields shown on list search box
  public ownSearchFields = []; // list of fields having own search createria

  // windows width adjust for list (replace table view, which is not good for narrow screen)
  public windowWidth = 600;

  // to show more details of the associationed field (an object) from list view
  public associationField: any;

  // options to control UI logic
  public options: any = {};

  // Export link
  public exportLink: string;
  public ignoreField: any; // used for export (send to server)

  // **** For child component of modal UI
  public inputData: any;
  public outputData: { action: string; value: any; detail?: any };
  public done: any;
  public doneData: any; // embedded view to emit data
  public focusEl: { nativeElement: { focus: () => void } }; // ElementRef

  // for term and condition view
  public termChecked = false;

  // **** For parent component of modal UI
  public refSelectDirective: any;
  public selectComponents: any; // {fieldName: component-type} format
  public componentFactoryResolver: ComponentFactoryResolver; // injected by extended class, if needed.
  public componentSubscription: any;

  public clickedId = null;
  public selectedId; //used by single selection components

  // list View UI control
  public clickItemAction: string = '';
  public itemMultiSelect: boolean = false;
  public cardHasLink: boolean = false;
  public canUpdate: boolean = false;
  public canDelete: boolean = false;
  public canArchive: boolean = false;
  public canCheck: boolean = false;
  public includeSubDetail: boolean = false;
  public cardHasSelect: boolean = false;

  /*Date Range Selection */
  hoveredDate: any;

  /*** Any View - add new component in the current view*/
  public parentData: any;
  public parentId: any;
  public isAdding: boolean = false;
  public isEditing: boolean = false;

  // archived search
  public archivedSearch: boolean = false;

  public snackbarMessages: any = {}; // keys: edit, create, list, detail, delete, deleteMany TODO: archive, unarchive

  public view: ViewType;

  constructor(
    public service: MddsBaseService,
    public injector: Injector,
    public router: Router,
    public route: ActivatedRoute,
    public location: Location) {
    
    this.parentItem = this.getParentRouteItem();
    if (injector) {
      this.commonService = injector.get<MddsCommonService>(
        MddsCommonService as Type<MddsCommonService>
      );
      this.componentFactoryResolver = injector.get<ComponentFactoryResolver>(
        ComponentFactoryResolver
      );
    }
  }

  public setItemNames(itemCamelName: string): void {
    this.itemCamelName = itemCamelName;
    this.ItemCamelName = itemCamelName.charAt(0).toUpperCase() + itemCamelName.substr(1);
    this.itemName = itemCamelName.toLowerCase();
  }

  public applyProperties(source: any, target: any, properties: string[]) {
    for (let property of properties) {
      if (typeof source[property] !== 'undefined') {
        target[property] = source[property];
      }
    }
  }

  public onServiceError(error: MddsServiceError): void {
    // clear any pending flags
    this.refreshing = false;

    let errMsg: string;
    let more: string;
    if (error.clientErrorMsg) {
      errMsg = error.clientErrorMsg;
    } else if (error.serverError) {
      if (error.status === 401) {
        return;
      } // Don't show unauthorized error
      if (typeof error.serverError === 'object') {
        errMsg = error.status + ': ' + JSON.stringify(error.serverError);
      } else {
        errMsg = error.status + ': ' + error.serverError;
      }
    }
    if (!errMsg) {
      errMsg = 'Unknown error.';
    }
    if (errMsg.length > 80) {
      more = errMsg;
      errMsg = errMsg.substring(0, 77) + '...';
    }
    const errorToastConfig: ErrorToastConfig = {
      content: errMsg,
      more,
    };
    const errorToast = new ErrorToast(errorToastConfig);
    errorToast.show();

    this.loaded = true;
  }
  public onServiceErrorSuppress(error: MddsServiceError): void {
    let errMsg: string;
    let more: string;
    if (error.clientErrorMsg) {
      errMsg = error.clientErrorMsg;
    } else if (error.serverError) {
      if (error.status === 401) {
        return;
      } // Don't show unauthorized error
      if (typeof error.serverError === 'object') {
        errMsg = error.status + ': ' + JSON.stringify(error.serverError);
      } else {
        errMsg = error.status + ': ' + error.serverError;
      }
    }
    if (!errMsg) {
      errMsg = 'Unknown error.';
    }
    console.error(errMsg);
  }

  public populatePages(): void {
    this.pages = [];
    const SHOW_PAGE = 5;
    const HALF = (SHOW_PAGE - 1) / 2;

    let min: number;
    let max: number;
    if (this.totalPages <= SHOW_PAGE) {
      min = 1;
      max = this.totalPages;
      this.leftMore = false;
      this.rightMore = false;
    } else {
      if (this.page - 1 < HALF) {
        min = 1;
        max = SHOW_PAGE - 1;
        this.leftMore = false;
        this.rightMore = true;
      } else if (this.totalPages - this.page < HALF) {
        max = this.totalPages;
        min = this.totalPages - SHOW_PAGE + 1 + 1;
        this.leftMore = true;
        this.rightMore = false;
      } else {
        min = this.page - HALF + 1;
        max = this.page + HALF - 1;
        this.leftMore = true;
        this.rightMore = true;
      }
    }
    for (let i = min; i <= max; i++) {
      this.pages.push(i);
    }
  }

  private getKey(key: string): string {
    const url = this.router.url.split(';')[0].split('?')[0];
    return url + ':' + this.schemaName + ':' + key;
  }
  private putToStorage(key: string, value: any): void {
    if (this.majorUi) {
      // only major UI we want to cache and recover when user comes back
      this.commonService.putToStorage(this.getKey(key), value);
    } else {
      this.storage[key] = value;
    }
  }
  private getFromStorage(key: string): any {
    if (this.majorUi) {
      return this.commonService.getFromStorage(this.getKey(key));
    } else {
      return this.storage[key];
    }
  }
  private routeToPage(page: number): void {
    this.putToStorage('page', page);
    this.populateList();
  }

  public onNextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }
    this.routeToPage(this.page + 1);
  }

  public onPreviousPage(): void {
    if (this.page <= 1) {
      return;
    }
    this.routeToPage(this.page - 1);
  }

  public onGotoPage(p: number): void {
    if (p > this.totalPages || p < 1) {
      return;
    }
    this.routeToPage(p);
  }

  public goBack() {
    this.location.back();
    /*
        // window.history.back();
        if (this.view !== ViewType.EDIT)
            this.location.back();
        else {
            let url = this.location.path(); //in EDIT view, the current url is skipped. So get the 'previous' one from path.
            this.router.navigateByUrl(url);
        }
        */
  }

  public adjustListViewForWindowSize() {
    this.windowWidth = window.innerWidth;
    if (this.windowWidth < 768) {
      this.datePickerDisplayMonths = 1;
    }
    if (this.windowWidth < 992) {
      if (!this.listViewProperties[this.listViewFilter].mobile) {
        // support mobile
        for (let view of this.listViews) {
          if (this.listViewProperties[view].mobile) {
            this.listViewFilter = view;
            break;
          }
        }
      }
    }
  }

  public stringify(detail: any): string {
    let str = '';
    for (const fnm of this.indexFields) {
      if (detail[fnm] && typeof detail[fnm] !== 'object') {
        str += ' ' + detail[fnm];
      }
    }
    if (!str) {
      for (const prop in detail) {
        if (
          prop !== '_id' &&
          detail[prop] &&
          typeof detail[prop] !== 'object'
        ) {
          str += ' ' + detail[prop];
        }
      }
    }
    if (!str) {
      str = detail._id ? detail._id : '...';
    }
    str = str.replace(/^\s+|\s+$/g, '');
    if (str.length > 50) {
      str = str.substr(0, 47) + '...';
    }
    return str;
  }

  public objectReduce(detail: any): any {
    let obj: any = {
      _id: detail._id,
    };
    for (const fnm of this.indexFields) {
      obj[fnm] = detail[fnm];
    }
    return obj;
  }

  /***Start: handle textarea fields***/
  public formatTextareaFields(detail: any): any {
    for (const fnm of this.textareaFields) {
      if (detail[fnm]) {
        detail[fnm] = detail[fnm]
          .replace(/\r\n/g, '<br/>')
          .replace(/\n/g, '<br/>');
      }
    }
    return detail;
  }
  /***Start: handle reference fields***/
  public formatReferenceField(field: any, fieldName: string): any {
    let id: string;
    if (typeof field === 'string') {
      // assume this is the '_id', let see we have the cached details for this ref from service
      const refDetail = this.commonService.getFromStorage(field);
      if (refDetail && typeof refDetail === 'object') {
        field = refDetail;
      } else {
        id = field;
        field = {
          _id: id,
          value: id,
          valueMedium: id,
          valueLong: id,
        };
      }
    } else if (field && typeof field === 'object') {
      id = field._id;
      let referIndexShort = '';
      let referIndexMedium = '';
      let referIndexLong = '';
      for (const k in field) {
        if (k !== '_id') {
          referIndexLong += ' ' + field[k];
        }
      }
      referIndexLong = referIndexLong.replace(/^\s+|\s+$/g, '');
      referIndexMedium = referIndexLong;
      referIndexShort = referIndexLong;
      if (referIndexLong.length >= 20) {
        referIndexShort = referIndexLong.substring(0, 17) + '...';
      }
      if (referIndexLong.length >= 50) {
        referIndexMedium = referIndexLong.substring(0, 47) + '...';
      }
      field = {
        _id: id,
        value: referIndexLong ? referIndexLong : id,
        valueMedium: referIndexMedium? referIndexMedium : id,
        valueShort: referIndexShort ? referIndexShort: id,
      };
    } else {
      // not defined
      field = {
        _id: id,
        value: undefined,
        valueMedium: undefined,
        valueLong: undefined,
      };
    }
    return field;
  }
  public formatReference(detail: any): any {
    for (const fnm of this.referenceFields) {
      detail[fnm] = this.formatReferenceField(detail[fnm], fnm);
    }
    return detail;
  }
  public deFormatReference(detail: any): any {
    for (const fnm of this.referenceFields) {
      if (typeof detail[fnm] !== 'object') {
        // not defined
        // let date values undefined
        delete detail[fnm];
      } else {
        const id = detail[fnm]._id;
        if (typeof id !== 'string') {
          delete detail[fnm];
        } else {
          detail[fnm] = id;
        }
      }
    }
    return detail;
  }

  public clearFieldReference(field: any): any {
    for (const prop of Object.keys(field)) {
      field[prop] = undefined;
    }
    return field;
  }

  public isDefinedFieldReference(field: any): any {
    if ('_id' in field && typeof field._id === 'string') {
      return true;
    }
    return false;
  }
  /***Start: handle date fields***/
  public formatDateField(field: string): any {
    const fmt = this.dateFormat;
    // let tFmt = this.timeFormat;
    let d: string | number;
    let M: string | number;
    let yyyy: number;
    let h: string | number;
    let m: string | number;
    let s: string | number;

    const dt = new Date(field);

    let dd: { toString: () => string };
    let MM: { toString: () => string };
    let hh: { toString: () => string };
    let mm: { toString: () => string };
    let ss: { toString: () => string };
    d = dt.getDate();
    M = dt.getMonth() + 1;
    yyyy = dt.getFullYear();

    const yy = yyyy.toString().slice(2);
    h = dt.getHours();
    m = dt.getMinutes();
    s = dt.getSeconds();

    dd = d < 10 ? '0' + d : d.toString();
    MM = M < 10 ? '0' + M : M.toString();
    hh = h < 10 ? '0' + h : h.toString();
    mm = m < 10 ? '0' + m : m.toString();
    ss = s < 10 ? '0' + s : s.toString();

    const value = fmt
      .replace(/yyyy/gi, yyyy.toString())
      .replace(/yy/gi, yy.toString())
      .replace(/MM/g, MM.toString())
      .replace(/dd/gi, dd.toString());

    // const t_value = tFmt.replace(/hh/ig, hh.toString()).
    //                replace(/mm/g, mm.toString()).
    //                replace(/ss/ig, ss.toString());
    /*Datepicker uses NgbDateStruct as a model and not the native Date object.
          It's a simple data structure with 3 fields. Also note that months start with 1 (as in ISO 8601).
  
          we add h, m, s here
          */
    // 'from' and 'to' used for search context. pop: show the selection popup
    return {
      date: { day: d, month: M, year: yyyy },
      value,
      originalValue: field,
      from: undefined,
      to: undefined,
      pop: false,
      time: { hour: h, minute: m, second: s },
      t_value: value,
      t_from: undefined,
      t_to: undefined,
      t_pop: false,
    };
  }

  public formatDate(detail: any): any {
    for (const fnm of this.dateFields) {
      if (typeof detail[fnm] !== 'string') {
        // not defined
        // important: let date values undefined. 'from' and 'to' used for search context. pop: show the selection popup
        detail[fnm] = {
          date: undefined,
          value: undefined,
          from: undefined,
          to: undefined,
          pop: false,
        };
      } else {
        detail[fnm] = this.formatDateField(detail[fnm]);
      }
    }
    return detail;
  }

  public deFormatDateField(date: any): string {
    let d: number;
    let M: number;
    let yyyy: number;
    // let h: any;
    // let m: any;
    // let s: any;

    yyyy = date.year;
    M = date.month - 1;
    d = date.day;

    if (
      typeof yyyy !== 'number' ||
      typeof M !== 'number' ||
      typeof d !== 'number'
    ) {
      return null;
    } else {
      const dt = new Date(yyyy, M, d, 0, 0, 0, 0);
      return dt.toISOString();
    }
  }

  public deFormatDate(detail: any): any {
    for (const fnm of this.dateFields) {
      if (typeof detail[fnm] !== 'object') {
        // not defined
        // let date values undefined
        delete detail[fnm];
      } else {
        if (!detail[fnm].date) {
          delete detail[fnm];
        } else {
          const dateStr = this.deFormatDateField(detail[fnm].date);
          if (!dateStr) {
            delete detail[fnm];
          } else {
            detail[fnm] = dateStr;
          }
        }
      }
    }
    return detail;
  }
  public clearFieldDate(field: any): any {
    for (const prop of Object.keys(field)) {
      field[prop] = undefined;
    }
    return field;
  }
  public isDefinedFieldDate(field: any): any {
    if (typeof field === 'object') {
      if (typeof field.date === 'object') {
        return true;
      }
      if (typeof field.from === 'object') {
        return true;
      }
      if (typeof field.to === 'object') {
        return true;
      }
    }
    return false;
  }

  /***Start: handle number fields***/
  public formatNumber(detail: any): any {
    //For each field, add 'from' / 'to' for search selection purpose
    for (const fnm of this.numberFields) {
      const fromFld = `__mra_${fnm}_from`;
      const toFld = `__mra_${fnm}_to`;
      detail[fromFld] = undefined;
      detail[toFld] = undefined;
    }
    return detail;
  }

  public deFormatNumber(detail: any): any {
    for (const fnm of this.numberFields) {
      const fromFld = `__mra_${fnm}_from`;
      const toFld = `__mra_${fnm}_to`;
      delete detail[fromFld];
      delete detail[toFld];
      if (typeof detail[fnm] !== 'number') {
        delete detail[fnm];
      }
    }
    return detail;
  }

  public clearFieldNumber(fnm: string) {
    const fromFld = `__mra_${fnm}_from`;
    const toFld = `__mra_${fnm}_to`;
    delete this.detail[fromFld];
    delete this.detail[toFld];
    delete this.detail[fnm];
  }
  /***Start: handle array of multi-selection fields***/
  public formatArrayMultiSelectionField(field: any, enums: any): any {
    const selectObj = {};
    let value = '';
    for (const e of enums) {
      selectObj[e] = false; // not exist
    }
    if (Array.isArray(field)) {
      // not defined
      for (const e of field) {
        selectObj[e] = true; // exist.
      }
      value = field.join(' | ');
    }
    return { selection: selectObj, value };
  }
  public formatArrayMultiSelection(detail: any): any {
    for (const fnm of this.multiSelectionFields) {
      detail[fnm] = this.formatArrayMultiSelectionField(
        detail[fnm],
        this.enums[fnm]
      );
    }
    return detail;
  }

  public deFormatArrayMultiSelection(detail: any): any {
    for (const fnm of this.multiSelectionFields) {
      if (typeof detail[fnm] !== 'object') {
        // not defined
        delete detail[fnm];
      } else {
        if (!detail[fnm].selection) {
          delete detail[fnm];
        } else {
          const selectArray = [];
          for (const e of this.enums[fnm]) {
            if (detail[fnm].selection[e]) {
              selectArray.push(e);
            }
          }

          if (selectArray.length > 0) {
            detail[fnm] = selectArray;
          } else {
            delete detail[fnm];
          }
        }
      }
    }
    return detail;
  }
  public clearFieldArrayMultiSelection(field: any): any {
    if (!field.selection) {
      return field;
    }
    for (const prop of Object.keys(field.selection)) {
      field.selection[prop] = false; // not exist
    }
    return field;
  }

  public isDefinedFieldArrayMultiSelection(field: any): any {
    if ('selection' in field && typeof field.selection === 'object') {
      const keys = Object.keys(field.selection);
      return keys.some((e) => field.selection[e]);
    }
    return false;
  }
  public multiselectionSelected(fieldName: string | number) {
    if (
      !this.detail[fieldName] ||
      typeof this.detail[fieldName].selection !== 'object'
    ) {
      return false;
    }
    return this.isDefinedFieldArrayMultiSelection(this.detail[fieldName]);
  }
  /***End: handle array of multi-selection fields***/
  /***Start: handle map fields***/
  public formatMapField(field: any, elementType: string): any {
    let selectObj = {};
    let values = [];
    if (typeof field === 'object') {
      selectObj = field;
      for (const e in field) {
        if (elementType === 'SchemaString') {
          values.push(e + '(' + field[e] + ')');
        }
      }
    }
    values = values.filter((x) => !!x);
    const value = values.join(' | ');
    return { selection: selectObj, value, keys: [] };
  }
  public formatMapFields(detail: any): any {
    for (const f of this.mapFields) {
      // [fieldName, elementType]
      detail[f[0]] = this.formatMapField(detail[f[0]], f[1]);
    }
    return detail;
  }

  public deFormatMapFields(detail: any): any {
    for (const f of this.mapFields) {
      // [fieldName, elementType]
      const fnm = f[0];
      const elementType = f[1];

      if (typeof detail[fnm] !== 'object') {
        // not defined
        delete detail[fnm];
      } else {
        if (!detail[fnm].selection) {
          delete detail[fnm];
        } else {
          const selectMap = detail[fnm].selection;
          // for (const e in detail[fnm].selection) {
          //   if (elementType === 'SchemaString') {
          //     ;
          //   }
          // }
          if (Object.keys(selectMap).length > 0) {
            detail[fnm] = selectMap;
          } else {
            delete detail[fnm];
          }
        }
      }
    }
    return detail;
  }

  public clearFieldMap(field: any): any {
    if (!field.selection) {
      return field;
    }
    field.selection = {};
    field.value = undefined;
    return field;
  }

  public isDefinedFieldMap(field: any): any {
    if ('selection' in field && typeof field.selection === 'object') {
      return Object.keys(field.selection).length > 0;
    }
    return false;
  }
  public mapSelected(fieldName: string | number) {
    if (
      !this.detail[fieldName] ||
      typeof this.detail[fieldName].selection !== 'object'
    ) {
      return false;
    }
    return this.isDefinedFieldMap(this.detail[fieldName]);
  }
  /***End: handle map fields***/
  /***Start: handle array fields***/
  public formatArrayField(field: any, elementType: string, elementObj: any): any {
    const selectArray = [];
    let values = [];
    if (typeof elementObj !== 'object') {
      elementObj = {};
    }
    if (Array.isArray(field)) {
      // not defined
      for (const e of field) {
        if (elementType === 'ObjectId') {
          const ref = this.formatReferenceField(e, '...');
          selectArray.push(ref);
          values.push(ref.value);
        } else if (
          elementType === 'SchemaString'
          && elementObj.mraType === 'httpurl'
          ) {
          const urlObj = this.formatHttpurlField(e, elementObj.urlDisplay);
          selectArray.push(urlObj);
          values.push(urlObj.display || urlObj.url);
        } else if (elementType === 'SchemaString') {
          selectArray.push(e);
          values.push(e);
        }
      }
    }
    values = values.filter((x) => !!x);
    const value = values.join(' | ');
    return { selection: selectArray, value };
  }
  public formatArrayFields(detail: any): any {
    for (const f of this.arrayFields) {
      // [fieldName, elementType, elementObj]
      detail[f[0]] = this.formatArrayField(detail[f[0]], f[1], f[2]);
    }
    return detail;
  }

  public deFormatArrayFields(detail: any): any {
    for (const f of this.arrayFields) {
      // [fieldName, elementType, elementObj]
      const fnm = f[0];
      const elementType = f[1];
      const elementObj = f[2] || {};

      if (typeof detail[fnm] !== 'object') {
        // not defined
        delete detail[fnm];
      } else {
        if (!detail[fnm].selection) {
          delete detail[fnm];
        } else {
          const selectArray = [];
          for (const e of detail[fnm].selection) {
            if (elementType === 'ObjectId') {
              if (e && e._id && typeof e._id === 'string') {
                selectArray.push(e._id);
              }
            } else if (
              elementType === 'SchemaString'
              && elementObj.mraType === 'httpurl'
              ) {
              if (!e || !e.url) continue;
              selectArray.push(JSON.stringify(e));
            } else if (elementType === 'SchemaString') {
              if (e) {
                selectArray.push(e);
              }
            }
          }

          if (selectArray.length > 0) {
            detail[fnm] = selectArray;
          } else {
            delete detail[fnm];
          }
        }
      }
    }
    return detail;
  }

  public clearFieldArray(field: any): any {
    if (!field.selection) {
      return field;
    }
    field.selection = [];
    field.value = undefined;
    return field;
  }

  public isDefinedFieldArray(field: any): any {
    if ('selection' in field && Array.isArray(field.selection)) {
      return field.selection.length > 0;
    }
    return false;
  }
  public arraySelected(fieldName: string | number) {
    if (
      !this.detail[fieldName] ||
      !Array.isArray(this.detail[fieldName].selection)
    ) {
      return false;
    }
    return this.isDefinedFieldArray(this.detail[fieldName]);
  }
  /***End: handle array fields***/
  /***Start: handle httpurl fields***/
  public formatHttpurlField(field: string, urlDisplay: string): any {
    if (!field) {
      return {
        display: urlDisplay || '',
        url: '',
      }
    }
    if (typeof field !== 'string') {
      return field;
    }
    try {
      let obj = JSON.parse(field);
      return obj; // expect to be in {url, display} format
    } catch(err) {
      // this is just a http url
      return {
        display: urlDisplay || '',
        url: field,
      }
    }
  }

  public formatHttpurlFields(detail: any): any {
    for (const f of this.httpurlFields) {
      // [fieldName, urlDisplay]
      detail[f[0]] = this.formatHttpurlField(detail[f[0]], f[1]);
    }
    return detail;
  }

  public deFormatHttpurlFields(detail: any): any {
    for (const f of this.httpurlFields) {
      // [fieldName, urlDisplay]
      const fnm = f[0];
      const urlDisplay = f[1];

      if (typeof detail[fnm] !== 'object') {
        // not defined
        delete detail[fnm];
      } else {
        if (!detail[fnm].url) {
          delete detail[fnm];
        } else {
          let objStr = JSON.stringify(detail[fnm]);
          detail[fnm] = objStr;
        }
      }
    }
    return detail;
  }
  public clearHttpurlField(field: any): any {
    return {
      display: '',
      url: '',
    };
  }
  public isDefinedHttpurlField(field: any): any {
    if (field.url) {
      return true;
    }
    return false;
  }
  public HttpurlFieldSelected(fieldName: string | number) {
    if (
      !this.detail[fieldName]
    ) {
      return false;
    }
    return this.isDefinedHttpurlField(this.detail[fieldName]);
  }
  /***End: handle array fields***/

  public formatDetail(detail: any): any {
    let cpy = Util.clone(detail);

    cpy = this.formatReference(cpy);
    cpy = this.formatDate(cpy);
    cpy = this.formatNumber(cpy);
    cpy = this.formatArrayMultiSelection(cpy);
    cpy = this.formatArrayFields(cpy);
    cpy = this.formatMapFields(cpy);
    cpy = this.formatHttpurlFields(cpy);
    return cpy;
  }

  public fieldHasValue(value: any) {
    if (typeof value === 'undefined') return false;
    if (typeof value === 'string') return !!value;
    return true;
  }

  public stringifyField(field: any): string {
    let str = '';

    if (!field) {
      return str;
    }
    if (
      typeof field === 'number' ||
      typeof field === 'string' ||
      typeof field === 'boolean' ||
      typeof field === 'bigint'
    ) {
      return String(field);
    }
    if (typeof field === 'object' && Array.isArray(field)) {
      for (const e of field) {
        str += ' | ' + this.stringifyField(e);
      }
      return str;
    }
    if (typeof field === 'object') {
      return field.value || field._id || '';
    }
    return str;
  }
  public getFieldDisplayFromFormattedDetail(
    detail: any,
    fieldName: string
  ): string {
    if (typeof detail !== 'object') {
      return '';
    }
    return this.stringifyField(detail[fieldName]);
  }

  public deFormatDetail(detail: any): any {
    let cpy = Util.clone(detail);

    cpy = this.deFormatReference(cpy);
    cpy = this.deFormatDate(cpy);
    cpy = this.deFormatNumber(cpy);
    cpy = this.deFormatArrayMultiSelection(cpy);
    cpy = this.deFormatArrayFields(cpy);
    cpy = this.deFormatMapFields(cpy);
    cpy = this.deFormatHttpurlFields(cpy);
    return cpy;
  }

  public populateDetail(id: string): EventEmitter<any> {
    return this.populateDetailForAction(id, null);
  }

  public onDetailReturned(detail: any, action: string): void {
    const originalDetail = Util.clone(detail);
    if (detail._id) {
      this.commonService.putToStorage(detail._id, originalDetail);
    } // cache it

    this.detail = this.formatDetail(detail);
    if (action === 'edit') {
      this.extraInfoPopulate(); // collect other info required for edit view
    } else {
      this.detail = this.formatTextareaFields(this.detail);
    }
    if (this.refreshing) {
      this.refreshing = false;
      let content = this.snackbarMessages.detail || 'Detail refreshed';
      const snackBarConfig: SnackBarConfig = {
        content,
      };
      const snackBar = new SnackBar(snackBarConfig);
      snackBar.show();
    }
    this.loaded = true;
    this.eventEmitter.emit({
      type: 'detail',
      result: this.detail,
    });
  }

  public populateDetailByFields(searchObj: any): EventEmitter<any> {
    const searchContext = { $and: [{ $or: [] }, { $and: [] }] };

    for (const field of Object.keys(searchObj)) {
      const o = {};
      o[field] = searchObj[field];
      searchContext.$and[1].$and.push(o);
    }
    const actionType = 'get';
    this.service
      .getList(
        1,
        1,
        searchContext,
        null,
        null,
        null,
        false,
        false,
        null,
        null,
        false,
        false,
        null, // categories
        null,
        actionType,
        null,
        this.ignoreField
      )
      .subscribe((result: { items: {}[] }) => {
        let detail = {};
        if (result.items && result.items.length >= 1) {
          detail = result.items[0];
        }
        const action = null;
        this.onDetailReturned(detail, action);
      }, this.onServiceError);
    return this.eventEmitter;
  }

  public searchHintFieldValues(): void {
    for (let f in this.editHintFields) {
      const sort = 'value';
      const field_value = undefined;
      const limit = 50;
      this.service.getFieldValues(f, field_value, sort, limit).subscribe((result: any) => {
        this.editHintFields[f] = result; // format: {_id: 'Beginner', count: 1}
      }, this.onServiceErrorSuppress);
    }
  }

  public populateDetailForAction(
    id: string,
    action: string
  ): EventEmitter<any> {
    // action: eg: action=edit  -> get detail for editing purpose
    this.service.getDetailForAction(id, action).subscribe((detail: any) => {
      this.onDetailReturned(detail, action);
    }, this.onServiceError);
    return this.eventEmitter;
  }

  public populateDetailFromCopy(copyId: string): void {
    this.service.getDetail(copyId).subscribe((detail: any) => {
      this.detail = this.formatDetail(detail);
      delete this.detail._id;
      this.extraInfoPopulate(); // collect other info required for create view
    }, this.onServiceError);
  }

  public extraInfoPopulate() {
    for (const fieldDef of this.mapFields) {
      // fieldDef: [field.fieldName, field.elementType, keyType, keyRefName, keyRefService, keyRefSubField]
      const fieldName = fieldDef[0]; // this.<keyRefName>.<keyRefSubField>
      const mapKeyType = fieldDef[2]; // this.<keyRefName>.<keyRefSubField>
      let keyArray = [];
      if (mapKeyType === 'ObjectId') {
        const keyRefName = fieldDef[3];
        const recordKey = 'key-id-' + keyRefName;
        const refService = this.injector.get<typeof fieldDef[4]>(fieldDef[4]);
        const id = this.detail[keyRefName]
          ? this.detail[keyRefName]._id
          : undefined;
        if (!id) {
          continue;
        }
        const mapField = this.detail[fieldName];
        if (mapField[recordKey] === id) {
          continue;
        } // already populated for the same id

        refService.getDetail(id).subscribe((detail: { [x: string]: any[] }) => {
          if (Array.isArray(detail[fieldDef[5]])) {
            keyArray = detail[fieldDef[5]];
            mapField.keys = keyArray;
            mapField[recordKey] = id; // record that keys is populated from this object
            if (mapField.selection) {
              for (const k of keyArray) {
                if (!(k in mapField.selection)) {
                  mapField.selection[k] = '';
                }
              }
            }
          }
        }, this.onServiceError);
      }
    }
  }

  public categorySelected(idx: number) {
    this.selectedCategory = idx;
    const category = this.categoryDisplays[idx];
    this.searchList();
  }
  public categorySelected2(idx: number) {
    this.selectedCategory2 = idx;
    const category = this.categoryDisplays2[idx];
    this.searchList();
  }

  private equalTwoSearchContextArrays(arr1: any[], arr2: any[]) {
    if (!arr1) {
      arr1 = [];
    }
    if (!arr2) {
      arr2 = [];
    }
    if (arr1.length === 0 && arr2.length === 0) {
      return true;
    }
    // all object in array has format of {'field': 'value'} format
    function compareObj(a: any, b: any) {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      if (aStr < bStr) {
        return -1;
      }
      if (aStr > bStr) {
        return 1;
      }
      return 0;
    }
    arr1 = arr1.sort(compareObj);
    arr2 = arr2.sort(compareObj);
    if (JSON.stringify(arr1) === JSON.stringify(arr2)) {
      return true;
    }
    return false;
  }

  public processSearchContext() {
    this.moreSearchOpened = false;
    const d = this.detail;

    const cate1 = this.listCategory1 || {}; // sub category
    const cate2 = this.listCategory2 || {}; // top catetory

    if (cate1.listCategoryField) {
      const field = cate1.listCategoryField;
      if (typeof this.selectedCategory === 'number') {
        d[field] = this.categories[this.selectedCategory][field];
      }
    }
    if (cate2.listCategoryField) {
      const field = cate2.listCategoryField;
      if (typeof this.selectedCategory2 === 'number') {
        d[field] = this.categories2[this.selectedCategory2][field];
      }
    }
    const orSearchContext = [];
    const andSearchContext = [];
    if (!this.searchDetailReady) {
      for (const s of this.stringBoxFields) {
        const o = {};
        o[s] = this.searchText;
        orSearchContext.push(o);
      }
    }

    this.searchMoreDetail = [];
    const d2 = this.deFormatDetail(d); // undefined field is deleted after this step.
    for (const field of Object.keys(d2)) {
      if (field === '_id') continue;

      let oValue: any;
      let oValueRaw: any[] = [];
      let valueToShow: any;

      // Non string fields
      oValue = d2[field];
      oValueRaw = [oValue];

      if (this.multiSelectionFields.includes(field)) {
        oValue = { $in: d2[field] }; // use $in for or, and $all for and
        oValueRaw = d2[field];

        const t = this.formatArrayMultiSelectionField(
          d2[field],
          this.enums[field]
        );
        valueToShow = t.value;
      } else if (this.arrayFields.some((x) => x[0] === field)) {
        oValue = { $in: d2[field] }; // use $in for or, and $all for and
        oValueRaw = d2[field];

        valueToShow = d[field].value;
      } else if (this.dateFields.includes(field)) {
        const t = this.formatDateField(d2[field]);
        valueToShow = t.value;
      } else if (this.referenceFields.includes(field)) {
        valueToShow = valueToShow = d[field].value;
      } else {
        valueToShow = d[field]; // take directly from what we get
      }

      if (this.ownSearchFields.includes(field)) {
        // don't show category field
        this.searchMoreDetail.push([this.fieldDisplayNames[field] || field, valueToShow, field]);
      }

      if (oValueRaw.includes(MddsUncategorized)) {
        oValue = null;
      }
      const o = {};
      if (!oValueRaw.includes(MddsAll)) { // MddsAll means no filter on this field
        o[field] = oValue;
        andSearchContext.push(o);
      }
    }
    // Handle date range selection. These fields are not in d2, because field.date is undefined.
    for (const prop of this.dateFields) {
      const o = {};
      let valueToShow = '';

      o[prop] = {};
      if (typeof d[prop] !== 'object') {
        // not defined
        continue;
      }
      if (!d[prop].from && !d[prop].to) {
        // not range
        continue;
      }
      if (d[prop].from) {
        o[prop].from = this.deFormatDateField(d[prop].from);
        valueToShow += this.formatDateField(o[prop].from).value;
      }
      valueToShow += ' ~ ';
      if (d[prop].to) {
        o[prop].to = this.deFormatDateField(d[prop].to);
        valueToShow += this.formatDateField(o[prop].to).value;
      }
      this.searchMoreDetail.push([this.fieldDisplayNames[prop] || prop, valueToShow, prop]);
      andSearchContext.push(o);
    }
    // Handle number range selection. These fields are not in d2.
    for (const fnm of this.numberFields) {
      const o = {};
      let valueToShow = '';

      o[fnm] = {};

      const fromFld = `__mra_${fnm}_from`;
      const toFld = `__mra_${fnm}_to`;

      if (typeof d[fromFld] !== 'number' && typeof d[toFld] !== 'number') {
        // not filled
        continue;
      }
      if (typeof d[fromFld] === 'number') {
        o[fnm].from = d[fromFld];
        valueToShow += d[fromFld];
      }
      valueToShow += ' ~ ';
      if (typeof d[toFld] === 'number') {
        o[fnm].to = d[toFld];
        valueToShow += d[toFld];
      }
      this.searchMoreDetail.push([this.fieldDisplayNames[fnm] || fnm, valueToShow, fnm]);
      andSearchContext.push(o);
    }

    if (this.detail._id) {
      // clear others and only leave the ID
      this.searchMoreDetail = [['ID', this.detail._id, '_id']];
    }
    let searchContext = {
      _id: this.detail._id,
      $and: [{ $or: orSearchContext }, { $and: andSearchContext }],
    };
    /* searchContext ={'$and', [{'$or', []},{'$and', []}]}
     */
    const context = this.getFromStorage('searchContext');
    if (context && context.$and) {
      let cachedOr: any;
      let cachedAnd: any;
      for (const sub of context.$and) {
        if ('$and' in sub) {
          cachedAnd = sub.$and;
        } else if ('$or' in sub) {
          cachedOr = sub.$or;
        }
      }
      if (
        this.equalTwoSearchContextArrays(cachedOr, orSearchContext) &&
        this.equalTwoSearchContextArrays(cachedAnd, andSearchContext) &&
        context._id === this.detail._id
      ) {
        return;
      }
    }

    if (orSearchContext.length === 0 && andSearchContext.length === 0 && !this.detail._id) {
      searchContext = null;
    }
    this.putToStorage('searchContext', searchContext);
    this.putToStorage('searchText', this.searchText);
    this.putToStorage('page', 1); // start from 1st page
    this.putToStorage('searchMoreDetail', this.searchMoreDetail);
    this.putToStorage('detail', this.detail);
  }
  public searchList(): EventEmitter<any> {
    this.processSearchContext();
    // update the URL
    if (!this.isEmptyRoutingPath()) {
      this.router.navigate(['.', {}], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
      }); // start from 1st page
    }
    this.putToStorage('page', 1); // start from 1st page
    return this.populateList();
  }
  public loadUIFromCache(): void {
    // Now let's reload the search condition to UI
    this.searchText = this.getFromStorage('searchText');
    this.searchMoreDetail = this.getFromStorage('searchMoreDetail');

    const listSortField = this.getFromStorage('listSortField');
    if (listSortField) {
      this.listSortField = listSortField;
    }
    const listSortOrder = this.getFromStorage('listSortOrder');
    if (listSortOrder) {
      this.listSortOrder = listSortOrder;
    }
    const listSortFieldDisplay = this.getFromStorage('listSortFieldDisplay');
    if (listSortFieldDisplay) {
      this.listSortFieldDisplay = listSortFieldDisplay;
    }

    const detail = this.getFromStorage('detail');
    if (detail) {
      this.detail = detail;
    }
  }

  public getCategoryInfo() {
    const cate1 = this.listCategory1 || {};
    const cate2 = this.listCategory2 || {};

    const urlCate1 = this.route.snapshot.queryParams.cate || this.urlCate1;
    const urlCate2 = this.route.snapshot.queryParams.cate2 || this.urlCate2;

    const categoryProvided =
      typeof this.selectedCategory === 'number' ? true : false;
    const listCategoryShowMore = typeof cate1.listCategoryShowMore
      ? true
      : false;
    const categoryCandidate = (categoryProvided || !urlCate1) ? '' : urlCate1;
    const categoryProvided2 =
      typeof this.selectedCategory2 === 'number' ? true : false;
    const listCategoryShowMore2 = typeof cate2.listCategoryShowMore
      ? true
      : false;
    const categoryCandidate2 = (categoryProvided2 || !urlCate2) ? '' : urlCate2;
    const listCategoryField = cate1.listCategoryField;
    const listCategoryField2 = cate2.listCategoryField;

    return {
      cate1: [
        listCategoryField,
        listCategoryShowMore,
        categoryProvided,
        categoryCandidate,
      ],
      cate2: [
        listCategoryField2,
        listCategoryShowMore2,
        categoryProvided2,
        categoryCandidate2,
      ],
    };
  }

  public populateList(): EventEmitter<any> {
    // First let's handle page
    let newPage: number;
    let searchContext: any;

    const urlPage = parseInt(this.route.snapshot.paramMap.get('page'), 10);
    const cachedPage = parseInt(this.getFromStorage('page'), 10);

    if (cachedPage) {
      newPage = cachedPage;
    } else if (urlPage) {
      newPage = urlPage;
    } else {
      newPage = 1;
    }

    let segmentParams = {};
    if (!this.isEmptyRoutingPath() && this.majorUi) {
      if (newPage !== 1) {
        segmentParams = { page: newPage };
      }
      this.router.navigate(['.', segmentParams], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
      }); // update the url
    }

    searchContext = this.getFromStorage('searchContext');
    this.loadUIFromCache();

    const cateInfo = this.getCategoryInfo();
    // cate1: [listCategoryField, listCategoryShowMore, categoryProvided, categoryCandidate],

    const actionType = 'get';

    this.archivedSearch = this.detail.archived;
    this.service
      .getList(
        newPage,
        this.perPage,
        searchContext,
        this.listSortField,
        this.listSortOrder,
        cateInfo.cate1[0],
        cateInfo.cate1[1],
        cateInfo.cate1[2],
        cateInfo.cate1[3],
        cateInfo.cate2[0],
        cateInfo.cate2[1],
        cateInfo.cate2[2],
        cateInfo.cate2[3],
        this.associationField,
        actionType,
        null,
        this.ignoreField
      )
      .subscribe(
        (result: {
          items: any[];
          categories: any;
          categoriesCounts: any;
          categoriesBrief: any;
          categories2: any;
          categoriesCounts2: any;
          categoriesBrief2: any;
          page: number;
          per_page: number;
          total_count: number;
          total_pages: number;
        }) => {
          this.list = result.items.map((x: any) => {
            let d = this.formatDetail(x);
            d = this.formatTextareaFields(d);
            let display = this.stringify(d);
            d.mddsDisplayName = display; // assign a display name
            return d;
          });
          this.originalList = result.items;

          const cateGroup = [
            {
              listCategoryField: cateInfo.cate1[0],
              categoryProvided: cateInfo.cate1[2],
              categories: result.categories,
              categoriesCounts: result.categoriesCounts,
              categoriesBrief: result.categoriesBrief,
              categoryCandidate: cateInfo.cate1[3],

              selectedCategoryName: '',

              categoriesOut: this.categories,
              categoryDisplays: this.categoryDisplays,
              categoriesCountsOut: this.categoriesCounts,
              categoryMore: this.categoryMore,
              selectedCategory: this.selectedCategory,
            },
            {
              listCategoryField: cateInfo.cate2[0],
              categoryProvided: cateInfo.cate2[2],
              categories: result.categories2,
              categoriesCounts: result.categoriesCounts2,
              categoriesBrief: result.categoriesBrief2,
              categoryCandidate: cateInfo.cate2[3],

              selectedCategoryName: '',

              categoriesOut: this.categories2,
              categoryDisplays: this.categoryDisplays2,
              categoriesCountsOut: this.categoriesCounts2,
              categoryMore: this.categoryMore2,
              selectedCategory: this.selectedCategory2,
            },
          ];
          for (let i = 0; i < 2; i++) {
            const c = cateGroup[i];
            if (c.listCategoryField && !c.categoryProvided) {
              // Non required field will have 'uncategorized' selection
              if (!this.requiredFields.includes(c.listCategoryField)) {
                const fakeObj = {};
                fakeObj[c.listCategoryField] = MddsUncategorized;
                c.categories.push(fakeObj);
                c.categoriesBrief.push({ _id: MddsUncategorized });
              }
              if (i === 0) {
                // Add 'All' selection
                const fakeObj = {};
                fakeObj[c.listCategoryField] = MddsAll;
                c.categories.splice(0, 0, fakeObj);
                c.categoriesBrief.splice(0, 0, { _id: MddsAll });
              }

              if (this.multiSelectionFields.includes(c.listCategoryField) ||
                  this.arrayFields.some( x => x[0] === c.listCategoryField)) {
                // back end support array value categorizing
                c.categories = c.categories.map(
                  (x) => {
                    x[c.listCategoryField] = [x[c.listCategoryField]];
                    return x;
                  }
                )
              }
              c.categoriesOut = c.categories.map((x: any) =>
                this.formatDetail(x)
              );
              c.categoriesCountsOut = c.categoriesCounts;

              // categories is a array of this.detail format with the listCategoryField field only
              c.categoryDisplays = c.categoriesOut.map((x) => {
                let display = this.getFieldDisplayFromFormattedDetail(
                  x,
                  c.listCategoryField
                );
                if (display === MddsUncategorized) {
                  display = 'Uncategorized';
                } else if (display === MddsAll) {
                  display = 'All';
                }
                return display;
              });

              // categoriesBrief is array of object of the category ref
              c.categoryMore = c.categoriesBrief;

              if (c.categoriesOut.length > 0) {
                let found = -1;
                for (let i = 0; i < c.categoriesOut.length; i++) {
                  const ct = c.categoriesOut[i][c.listCategoryField];
                  if (
                    (typeof ct === 'object' &&
                      ct._id === c.categoryCandidate) ||
                    ct === c.categoryCandidate
                  ) {
                    found = i;
                    break;
                  }
                }
                if (found >= 0) {
                  c.selectedCategory = found;
                } else {
                  c.selectedCategory = 0;
                }
              }
            }
            if (c.listCategoryField) {
              const ct =
                c.categoriesOut[c.selectedCategory][c.listCategoryField];
              if (typeof ct === 'object') {
                c.selectedCategoryName = ct._id;
              } else {
                c.selectedCategoryName = ct;
              }
            }
          }
          this.categories = cateGroup[0].categoriesOut;
          this.categoriesCounts = cateGroup[0].categoriesCountsOut;
          this.categoryMore = cateGroup[0].categoryMore;
          this.selectedCategory = cateGroup[0].selectedCategory;
          this.categoryDisplays = cateGroup[0].categoryDisplays;
          this.categories2 = cateGroup[1].categoriesOut;
          this.categoriesCounts2 = cateGroup[1].categoriesCountsOut;
          this.categoryMore2 = cateGroup[1].categoryMore;
          this.selectedCategory2 = cateGroup[1].selectedCategory;
          this.categoryDisplays2 = cateGroup[1].categoryDisplays;

          if (this.majorUi) {
            const queryParams: any = {};
            if (cateGroup[0].selectedCategoryName) {
              queryParams.cate = cateGroup[0].selectedCategoryName;
            }
            if (cateGroup[1].selectedCategoryName) {
              queryParams.cate2 = cateGroup[1].selectedCategoryName;
            }
            this.router.navigate(['.'], {
              relativeTo: this.route,
              queryParams,
              queryParamsHandling: 'merge',
            }); // update the url
          }

          this.page = result.page;
          this.perPage = result.per_page;
          this.totalCount = result.total_count;
          this.totalPages = result.total_pages;
          this.populatePages();

          this.clearSelectItems();

          if (this.refreshing) {
            this.refreshing = false;
            let content = this.snackbarMessages.list || 'List refreshed';
            const snackBarConfig: SnackBarConfig = {
              content,
            };
            const snackBar = new SnackBar(snackBarConfig);
            snackBar.show();
          }
          this.eventEmitter.emit({
            type: 'list',
            result: this.list,
          });
          this.loaded = true;
        },
        this.onServiceError
      );
    return this.eventEmitter;
  }

  /*UI operations handlers*/
  public setListViewFilter(view: string): void {
    this.listViewFilter = view;
    this.putToStorage('listViewFilter', this.listViewFilter);
  }
  public isShowListView(view: string): boolean {
    const cached = this.getFromStorage('listViewFilter');
    return cached ? cached === view : this.listViewFilter === view;
  }
  public setListSort(
    field: string,
    fieldDisplay: string,
    order: string
  ): boolean {
    let refresh = false;
    if (field !== this.listSortField || order !== this.listSortOrder) {
      refresh = true;
    }
    this.listSortField = field;
    this.listSortFieldDisplay = fieldDisplay;
    this.listSortOrder = order;
    this.putToStorage('listSortField', field);
    this.putToStorage('listSortFieldDisplay', fieldDisplay);
    this.putToStorage('listSortOrder', order);

    return refresh;
  }
  public setListSortAndRefresh(
    field: string,
    fieldDisplay: string,
    order: string
  ): void {
    const refresh = this.setListSort(field, fieldDisplay, order);
    if (refresh) {
      this.searchList();
    } // call search list, instead of populate list, in case there are other search context.
  }
  public toggleListSort(field: string, displayName?: string): void {
    if (field !== this.listSortField) {
      this.listSortOrder = 'asc';
    } else {
      if (this.listSortOrder === 'asc') {
        this.listSortOrder = 'desc';
      } else {
        this.listSortOrder = 'asc';
      }
    }
    if (!displayName) {
      displayName = this.fieldDisplayNames[field] || field;
    }
    this.setListSort(field, displayName, this.listSortOrder);

    this.populateList();
  }

  public onRefresh(): void {
    if (this.view === ViewType.LIST) {
      this.refreshing = true;
      this.populateList();
    } else if (this.view === ViewType.DETAIL) {
      this.refreshing = true;
      if (!this.id) {
        this.id = this.route.snapshot.paramMap.get('id');
      }
      if (this.id) {
        this.populateDetail(this.id);
      } else {
        console.error('Routing error for detail view... no id...');
      }
    }
  }

  public onExport(): void {
    const searchContext = this.getFromStorage('searchContext');
    this.loadUIFromCache();

    const cateInfo = this.getCategoryInfo();
    const actionType = 'export';
    this.service
      .getList(
        0,
        0,
        searchContext,
        this.listSortField,
        this.listSortOrder,
        cateInfo.cate1[0],
        cateInfo.cate1[1],
        cateInfo.cate1[2],
        cateInfo.cate1[3],
        cateInfo.cate2[0],
        cateInfo.cate2[1],
        cateInfo.cate2[2],
        cateInfo.cate2[3],
        this.associationField,
        actionType,
        null,
        this.ignoreField
      )
      .subscribe(
        (data: {
          gotFileNameFromContentDisposition: any;
          attachment: any;
          filename: any;
        }) => {
          // xlsx file returned
          let rawData;
          let filename: string;
          if (
            typeof data === 'object' &&
            data.gotFileNameFromContentDisposition
          ) {
            // got file name from Content-Disposition
            rawData = data.attachment;
            filename = data.filename;
          } else {
            rawData = data;
          }
          // TODO: get type from content type
          const blob = new Blob([rawData], {
            type:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const downloadUrl = window.URL.createObjectURL(blob);

          if (filename) {
            // use HTML5 a[download] attribute to specify filename
            const a = document.createElement('a');
            // safari doesn't support this yet
            if (typeof a.download === 'undefined') {
              window.open(downloadUrl);
            } else {
              a.href = downloadUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
            }
          } else {
            window.open(downloadUrl);
          }
          setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
          }, 100); // cleanup temporary url blob
        },
        this.onServiceError
      );
  }

  public onActionBase(
    actionType: any,
    actionData: any,
    succMessage: any,
    resultFields: string[]
  ): void {
    const searchContext = this.getFromStorage('searchContext');
    this.loadUIFromCache();

    const cateInfo = this.getCategoryInfo();

    this.service
      .getList(
        0,
        0,
        searchContext,
        this.listSortField,
        this.listSortOrder,
        cateInfo.cate1[0],
        cateInfo.cate1[1],
        cateInfo.cate1[2],
        cateInfo.cate1[3],
        cateInfo.cate2[0],
        cateInfo.cate2[1],
        cateInfo.cate2[2],
        cateInfo.cate2[3],
        this.associationField,
        actionType,
        actionData,
        this.ignoreField
      )
      .subscribe((data: { [x: string]: any }) => {
        let additionalInfo = '';
        if (resultFields && resultFields.length > 0) {
          for (const f of resultFields) {
            additionalInfo += ` ${f} ${data[f]};`;
          }
        }
        const snackBarConfig: SnackBarConfig = {
          content: `${succMessage} ${additionalInfo}`,
        };
        const snackBar = new SnackBar(snackBarConfig);
        snackBar.show();
      }, this.onServiceError);
  }

  public isTermChecked(): boolean {
    return this.termChecked;
  }
  public onTermChecked(): void {
    // no changing value because two binded already
    this.eventEmitter.emit({
      type: 'check',
      result: this.termChecked,
    });
  }

  public onCheckAllChange(): void {
    this.checkedItem = Array.apply(null, Array(this.list.length)).map(
      Boolean.prototype.valueOf,
      this.checkAll
    );

    this.notifyItemSelected();
  }

  public isItemSelected(): boolean {
    // single selection or multiple selection
    return this.checkedItem.some((value) => value);
  }

  public getSelectedItems(): any[] {
    const selectedItems = [];
    for (const [indx, ckd] of this.checkedItem.entries()) {
      if (ckd) {
        selectedItems.push(this.list[indx]);
      }
    }
    return selectedItems;
  }

  // triggered by user selection from checkbox or dropdown list
  public notifyItemSelected() {
    // no changing value because already handled with other function or two way bindings
    this.eventEmitter.emit({
      type: 'selection',
      result: this.getSelectedItems(),
    });
  }

  public onDeleteSelected(): void {
    const deletedItem = [];
    this.checkedItem.forEach((value, index) => {
      if (value) {
        deletedItem.push(this.list[index]._id);
      }
    });

    const modalConfig: ModalConfig = {
      title: 'Delete Confirmation',
      content:
        'Are you sure you want to delete selected items from the system?',
      // list of button text
      buttons: ['Delete', 'Cancel'],
      // list of button returns when clicked
      returns: [true, false],
      callBack: (result: any) => {
        if (result) {
          this.service.deleteManyByIds(deletedItem).subscribe((_: any) => {
            let content = this.snackbarMessages.deleteMany || this.ItemCamelName + ' deleted';
            const snackBarConfig: SnackBarConfig = {
              content,
            };
            const snackBar = new SnackBar(snackBarConfig);
            snackBar.show();

            if (this.view !== ViewType.LIST) {
              this.router.navigate([this.listRouterLink], { relativeTo: this.route });
            } else {
              const len = this.checkedItem.length;
              for (let i = 0; i < len; i++) {
                const idx = len - 1 - i;
                const value = this.checkedItem[idx];
                if (value) {
                  this.list.splice(idx, 1);
                  this.checkedItem.splice(idx, 1);
                  this.totalCount -= 1;
                }
              }
            }
          }, this.onServiceError);
        }
      },
    };
    const modal = new Modal(modalConfig);
    modal.show();
  }

  public onDelete(id: string, idx: number): void {
    const modalConfig: ModalConfig = {
      title: 'Delete Confirmation',
      content:
        'Are you sure you want to delete this ' +
        this.itemCamelName +
        ' from the system?',
      // list of button text
      buttons: ['Delete', 'Cancel'],
      // list of button returns when clicked
      returns: [true, false],
      callBack: (result: any) => {
        if (result) {
          this.service.deleteOne(id).subscribe((_: any) => {
            let content = this.snackbarMessages.delete || this.ItemCamelName + ' deleted';
            const snackBarConfig: SnackBarConfig = {
              content,
            };
            const snackBar = new SnackBar(snackBarConfig);
            snackBar.show();

            if (this.view !== ViewType.LIST) {
              this.router.navigate([this.listRouterLink], { relativeTo: this.route });
            } else if (idx !== null && this.list) {
              this.list.splice(idx, 1);
              this.checkedItem.splice(idx, 1);
              this.totalCount -= 1;
            }
          }, this.onServiceError);
        }
      },
    };

    const modal = new Modal(modalConfig);
    modal.show();
  }

  public onArchive(id: string, idx: number, archived: boolean): void {
    const modalConfig: ModalConfig = {
      title: 'Archive Confirmation',
      content:
        `Are you sure you want to ${archived ? 'unarchive' : 'archive'} ` +
        `this ${this.itemCamelName} and ${
          archived ? 'restore' : 'remove'
        } it from search result?`,
      // list of button text
      buttons: [archived ? 'Unarchive' : 'Archive', 'Cancel'],
      // list of button returns when clicked
      returns: [true, false],
      callBack: (result: any) => {
        if (result) {
          this.service.archiveOne(id, archived).subscribe((_: any) => {
            const snackBarConfig: SnackBarConfig = {
              content:
                this.ItemCamelName + (archived ? ' unarchived' : ' archived'),
            };
            const snackBar = new SnackBar(snackBarConfig);
            snackBar.show();

            if (this.view !== ViewType.LIST) {
              this.detail.archived = !archived;
            } else if (idx !== null && this.list) {
              this.list.splice(idx, 1);
              this.checkedItem.splice(idx, 1);
              this.totalCount -= 1;
            }
          }, this.onServiceError);
        }
      },
    };

    const modal = new Modal(modalConfig);
    modal.show();
  }

  public onPrint(): void {
    window.print();
  }

  public onArchiveSelected(): void {
    const archivedItem = [];
    this.checkedItem.forEach((value, index) => {
      if (value) {
        archivedItem.push(this.list[index]._id);
      }
    });

    const modalConfig: ModalConfig = {
      title: 'Archive Confirmation',
      content:
        `Are you sure you want to ${
          this.archivedSearch ? 'unarchive' : 'archive'
        }` +
        `  selected items and ${
          this.archivedSearch ? 'restore' : 'remove'
        } them from search results?`,
      // list of button text
      buttons: [this.archivedSearch ? 'Unarchive' : 'Archive', 'Cancel'],
      // list of button returns when clicked
      returns: [true, false],
      callBack: (result: any) => {
        if (result) {
          this.service
            .archiveManyByIds(archivedItem, this.archivedSearch)
            .subscribe((_: any) => {
              const snackBarConfig: SnackBarConfig = {
                content:
                  this.ItemCamelName +
                  (this.archivedSearch ? ' unarchived' : ' archived'),
              };
              const snackBar = new SnackBar(snackBarConfig);
              snackBar.show();

              if (this.view !== ViewType.LIST) {
                this.router.navigate([this.listRouterLink], {
                  relativeTo: this.route,
                });
              } else {
                const len = this.checkedItem.length;
                for (let i = 0; i < len; i++) {
                  const idx = len - 1 - i;
                  const value = this.checkedItem[idx];
                  if (value) {
                    this.list.splice(idx, 1);
                    this.checkedItem.splice(idx, 1);
                    this.totalCount -= 1;
                  }
                }
              }
            }, this.onServiceError);
        }
      },
    };
    const modal = new Modal(modalConfig);
    modal.show();
  }

  public onSubmit(): void {
    this.cloneDetail = this.deFormatDetail(this.detail);
    if (this.id) {
      this.service
        .updateOne(this.id, this.cloneDetail)
        .subscribe((result: any) => {
          let content = this.snackbarMessages.edit || this.ItemCamelName + ' updated.';
          const snackBarConfig: SnackBarConfig = {
            content,
          };
          const snackBar = new SnackBar(snackBarConfig);
          snackBar.show();

          if (this.embeddedView) {
            this.doneData.emit(result);
            this.done.emit(true);
          } else {
            this.router.navigate(['../../detail', this.id], {
              relativeTo: this.route,
            });
          }
        }, this.onServiceError);
    } else {
      this.service
        .createOne(this.cloneDetail)
        .subscribe((result: { [x: string]: string }) => {
          const action = this.embeddedView ? ' added' : ' created.';
          let content = this.snackbarMessages.create || this.ItemCamelName + action;
          const snackBarConfig: SnackBarConfig = {
            content,
          };
          const snackBar = new SnackBar(snackBarConfig);
          snackBar.show();

          this.id = result._id;
          this.cloneDetail = result;

          if (this.embeddedView) {
            this.doneData.emit(result);
            this.done.emit(true);
          } else {
            this.router.navigate(['../detail', this.id], {
              relativeTo: this.route,
            });
          }
        }, this.onServiceError);
    }
  }

  public editCancel(): void {
    if (this.embeddedView) {
      this.done.emit(false);
    } else {
      this.goBack();
    }
  }

  public onDisplayRefClicked(fn: string, detail: any, event: any): void {
    const ref = this.getRefFromField(fn);
    const d = detail;

    if (d && d._id) {
      if (this.list) {
        for (const item of this.list) {
          if (item[fn] === d) {
            this.clickedId = item._id;
          }
        }
      }
      if (this.modulePath) {
        this.router.navigate([this.modulePath, ref, 'detail', d._id]); // {relativeTo: this.getParentActivatedRouter() };
      } else {
        this.router.navigate([ref, 'detail', d._id], {
          relativeTo: this.getParentActivatedRouter(),
        });
      }
    }
    if (event) {
      event.stopPropagation();
    }
  }

  public onDetailLinkClicked(id: string): void {
    this.clickedId = id;
    if (this.modulePath) {
      this.router.navigate([this.modulePath, this.schemaName, 'detail', id]); // {relativeTo: this.getParentActivatedRouter() }
    } else {
      this.router.navigate([this.itemName, 'detail', id], {
        relativeTo: this.getParentActivatedRouter(),
      });
    }
  }

  public getRefFromField(fn: string): string {
    return this.referenceFieldsMap[fn];
  }

  public clearValueFromDetail(field: string): void {
    // handle number first
    if (this.numberFields.includes(field)) {
      this.clearFieldNumber(field);
      return;
    }

    if (!this.detail.hasOwnProperty(field)) {
      return;
    }
    if (typeof this.detail[field] === 'undefined') {
      return;
    }
    if (typeof this.detail[field] === 'object') {
      // reference field or date
      if (this.multiSelectionFields.includes(field)) {
        this.detail[field] = this.clearFieldArrayMultiSelection(
          this.detail[field]
        );
      } else if (this.arrayFields.some((x) => x[0] === field)) {
        this.detail[field] = this.clearFieldArray(this.detail[field]);
      } else if (this.mapFields.some((x) => x[0] === field)) {
        this.detail[field] = this.clearFieldMap(this.detail[field]);
      } else if (this.dateFields.includes(field)) {
        this.detail[field] = this.clearFieldDate(this.detail[field]);
      } else if (this.referenceFields.includes(field)) {
        this.detail[field] = this.clearFieldReference(this.detail[field]);
      } else if (this.httpurlFields.includes(field)) {
        this.detail[field] = this.clearHttpurlField(this.detail[field]);
      }
      // check if any info needs to change after clear certain values;
      this.extraInfoPopulate();
    } else {
      delete this.detail[field];
    }
  }
  public clearValueFromArrayField(field: string, idx: number): void {
    if (this.detail[field].selection) {
      this.detail[field].selection = this.detail[field].selection.filter(
        (x: any, i: number) => i !== idx
      );
      this.detail[field].value = this.detail[field].selection.join(' | ');
      // check if any info needs to change after clear certain values;
      this.extraInfoPopulate();
    }
  }
  public clearValueFromMapField(field: string, key: string): void {
    if (this.detail[field].selection) {
      delete this.detail[field].selection[key];
      // check if any info needs to change after clear certain values;
      this.extraInfoPopulate();
    }
  }
  public clearValueFromMapKey(field: string, key: string): void {
    if (this.detail[field].selection) {
      this.detail[field].selection[key] = undefined;
      // check if any info needs to change after clear certain values;
      this.extraInfoPopulate();
    }
  }
  public clearValueFromUrlLink(field: string) {
    if (this.detail[field].url) {
      this.detail[field].url = '';
      this.extraInfoPopulate();
    }
  }
  public clearValueFromUrlDisplay(field: string) {
    if (this.detail[field].display) {
      this.detail[field].display = '';
      this.extraInfoPopulate();
    }
  }

  public checkValueDefinedFromDetail(field: string): boolean {
    const d = this.detail;
    const fromFld = `__mra_${field}_from`;
    const toFld = `__mra_${field}_to`;
    if (
      typeof this.detail[field] === 'number' ||
      typeof d[field] === 'string' ||
      typeof d[field] === 'boolean' ||
      typeof d[fromFld] === 'number' ||
      typeof d[toFld] === 'number'
    ) {
      return true;
    }
    if (!d.hasOwnProperty(field)) {
      return false;
    }
    if (typeof d[field] === 'undefined') {
      return false;
    }
    if (typeof d[field] === 'object') {
      if (this.multiSelectionFields.includes(field)) {
        return this.isDefinedFieldArrayMultiSelection(d[field]);
      } else if (this.arrayFields.some((x) => x[0] === field)) {
        return this.isDefinedFieldArray(d[field]);
      } else if (this.mapFields.some((x) => x[0] === field)) {
        return this.isDefinedFieldMap(d[field]);
      } else if (this.dateFields.includes(field)) {
        return this.isDefinedFieldDate(d[field]);
      } else if (this.referenceFields.includes(field)) {
        return this.isDefinedFieldReference(d[field]);
      }
    }
    return false;
  }

  public clearValueFromDetailAndSearchList(field: string): void {
    this.clearValueFromDetail(field);
    this.searchList();
  }

  public onAddArrayItem(fieldName: string) {
    this.detail[fieldName].adding = false;

    let arrayField = this.arrayFields.find(x => x[0] === fieldName);
    if (arrayField) {
      let elementType = arrayField[1];
      let elementObj = arrayField[2] || {};
      if (this.detail[fieldName].new) {
        // where new added item is stored
        const item = this.detail[fieldName].new;
        let value = item;

        let r = this.formatArrayField([undefined], elementType, elementObj);
        this.detail[fieldName].new = r.selection[0]; // initialize the new obj

        if (
          elementType === 'SchemaString'
          && elementObj.mraType === 'httpurl'
          ) {
          if (!item.url) return; // no url entered.
          value = item.display || item.url;
        }

        this.detail[fieldName].selection.push(item);

        let valueArr = this.detail[fieldName].value.split(' | ');
        valueArr.push(value);
        this.detail[fieldName].value = valueArr.join(' | ');
        // see if related info needs to change after the change of this value
        this.extraInfoPopulate();
      }
    }
  }

  public onAddArrayItemValue(fieldName: string, value: string) {
    this.detail[fieldName].new = value; // clear it
    this.onAddArrayItem(fieldName);
  }

  public onAddArrayItemClicked(fieldName: string) {
    let arrayField = this.arrayFields.find(x => x[0] === fieldName);

    if (arrayField) {
      this.detail[fieldName].adding = true;
      let r = this.formatArrayField([undefined], arrayField[1], arrayField[2]);
      this.detail[fieldName].new = r.selection[0]; // initialize the new obj
    }
  }
  public onAddArrayItemCancelled(fieldName: string) {
    if (this.arrayFields.some((x) => x[0] === fieldName)) {
      this.detail[fieldName].adding = false;
    }
  }
  public onAddMapItem(fieldName: string) {
    if (this.mapFields.some((x) => x[0] === fieldName)) {
      if (this.detail[fieldName].new) {
        // where new added item is stored
        const item = this.detail[fieldName].new;
        this.detail[fieldName].new = undefined; // clear it

        this.detail[fieldName].selection[item] = undefined; // move to selection object

        // TODO: this.detail[fieldName]['value'] change

        // see if related info needs to change after the change of this value
        this.extraInfoPopulate();
      }
    }
  }

  public onRefSelect(fieldName: string) {
    if (!this.refSelectDirective) {
      console.warn('No reference directive for field: ', fieldName);
      return;
    }
    const viewContainerRef = this.refSelectDirective.viewContainerRef;
    viewContainerRef.clear();

    if (!this.selectComponents[fieldName]) {
      console.warn('No reference defined for field: ', fieldName);
      return;
    }
    let componentRef = this.selectComponents[fieldName].componentRef;
    if (!componentRef) {
      const comType = this.selectComponents[fieldName]['select-type'];
      if (!comType) {
        console.warn('No component type found for reference field ', fieldName);
      }

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
        comType
      );
      componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call
      this.selectComponents[fieldName].componentRef = componentRef; // save it
    } else {
      viewContainerRef.insert(componentRef.hostView);
    }

    const componentInstance = componentRef.instance as MddsBaseComponentInterface;
    if (this.detail[fieldName]) {
      if (this.referenceFields.includes(fieldName)) {
        componentInstance.inputData = this.detail[fieldName]._id;
      }
    }
    componentInstance.setFocus();

    this.componentSubscription = componentInstance.done.subscribe(
      (val: any) => {
        if (val) {
          this.componentSubscription.unsubscribe();
          viewContainerRef.detach(); // only detach. not destroy
        }
        const outputData = componentInstance.outputData;
        if (outputData) {
          switch (outputData.action) {
            case 'selected':
              // outputData.detail is an array
              if (this.arrayFields.some((x) => x[0] === fieldName)) {
                let arr = this.detail[fieldName].selection.concat(outputData.detail);
                this.detail[fieldName] = this.formatArrayField(arr, 'ObjectId', undefined);
              } else if (this.referenceFields.includes(fieldName)) {
                this.detail[fieldName] = this.formatReferenceField(outputData.detail[0], '');
              }
              // trigger extraInfo populate, once reference changed.
              this.extraInfoPopulate();
              break;
            case 'view':
              this.onRefShow(fieldName, 'select', outputData.value); // value is _id
              break;
            default:
              break;
          }
        }
      }
    );
  }

  public onRefShow(fieldName: string, action: string, id: string) {
    if (!id && this.detail[fieldName]) {
      id = this.detail[fieldName]._id;
    }
    if (!id) {
      console.error('Show reference but no id is given.');
      return;
    }
    const viewContainerRef = this.refSelectDirective.viewContainerRef;
    viewContainerRef.clear();

    const detailType = action + '-detail-type'; // eg: select-detail-type, pop-detail-type
    const comType = this.selectComponents[fieldName][detailType];
    if (!comType) {
      console.error('No component type found for: %s', detailType);
      return;
    }
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      comType
    );
    const componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call

    const componentInstance = componentRef.instance as MddsBaseComponentInterface;
    componentInstance.inputData = id;
    componentInstance.setFocus();

    componentInstance.done.subscribe((val: any) => {
      if (val) {
        componentInstance.done.unsubscribe();
        viewContainerRef.clear();
      }
      const outputData = componentInstance.outputData;
      if (outputData) {
        switch (outputData.action) {
          case 'selected':
            // outputData.detail is an array
            if (this.arrayFields.some((x) => x[0] === fieldName)) {
              let arr = this.detail[fieldName].selection.concat(outputData.detail);
              this.detail[fieldName] = this.formatArrayField(arr, 'ObjectId', undefined);
            } else if (this.referenceFields.includes(fieldName)) {
              this.detail[fieldName] = this.formatReferenceField(outputData.detail[0], '');
            }
            // trigger extraInfo populate, once reference changed.
            this.extraInfoPopulate();
            break;
          case 'back':
            this.onRefSelect(fieldName);
            break;
          default:
            break;
        }
      }
    });
  }

  // Following havn't been used yet
  /*
    private typingTimer;
    public onKeyUp(fieldName:string, value:string):void {
        clearTimeout(this.typingTimer);

        this.typingTimer = setTimeout(function () {
            console.log('Input Value:', value);
        }, 1000);
    }
    */

  setFocus() {
    if (this.focusEl) {
      this.focusEl.nativeElement.focus();
    }
  }
  uiCloseModal() {
    this.outputData = null;
    this.done.emit(true);
  }
  uiOnEscapeKey() {
    this.uiCloseModal();
  }

  clickOneItem(i: number) {
    const detail = this.list[i];
    this.clickedId = detail._id;

    if (this.clickItemAction === 'select') {
      this.selectOneItem(i);
    } else if (this.clickItemAction === 'detail') {
      this.onDetailLinkClicked(this.clickedId);
    }
  }
  selectOneItem(i: number) {
    this.checkedItem[i] = !this.checkedItem[i];
    const detail = this.list[i];
    this.clickedId = detail._id;
    this.selectedId = detail._id;

    if (this.checkedItem[i]) {
      // selected
      if (!this.itemMultiSelect) {
        this.clearSelectItems();
      }
      this.checkedItem[i] = true;
    }
    this.notifyItemSelected();
  }
  // triggered when there is a change of page or search condition
  clearSelectItems() {
    this.selectedId = undefined;
    this.checkedItem = Array.apply(null, Array(this.list.length)).map(
      Boolean.prototype.valueOf,
      false
    );
    this.checkAll = false;
  }
  // Second step of two-step selection
  selectItemConfirmed() {
    let values = this.getSelectedItems();
    values = values.map(x => this.objectReduce(x));
    this.outputData = {
      action: 'selected',
      value: undefined,
      detail: values, // array
    };
    this.done.emit(true);
  }
  // One-step selection - select and confirm
  selectItemSelected(num: number) {
    if (typeof num !== 'number') {
      return;
    }
    this.selectOneItem(num);
    this.selectItemConfirmed();
  }

  // selected from detail view
  detailSelSelected() {
    let detail = this.objectReduce(this.detail);
    this.outputData = {
      action: 'selected',
      value: { _id: detail._id, value: this.stringify(detail) },
      detail: [detail],
    };
    this.done.emit(true);
  }

  // select to view detail
  selectViewDetail(num: number) {
    const detail = this.list[num];
    this.clickedId = detail._id;
    this.outputData = { action: 'view', value: detail._id };
    this.done.emit(true);
  }

  detailSelBack() {
    this.outputData = { action: 'back', value: null };
    this.done.emit(true);
  }

  // Search more in the list view
  toggleMoreSearch() {
    this.moreSearchOpened = !this.moreSearchOpened;
  }
  onSearchTextClear(): void {
    this.searchText = undefined;
    if (!this.moreSearchOpened) {
      this.searchList();
    }
  }
  onSearchClear() {
    this.searchText = undefined;
    const detail = {};
    this.detail = this.formatDetail(detail);
    this.searchList();
  }

  /*Parent router related*/
  public getParentRouteItem(): string {
    if (!this.route) {
      return undefined;
    }
    let routeSnapshot = this.route.snapshot;
    let parentItem: string;
    do {
      if (routeSnapshot.data && routeSnapshot.data.mraLevel === 1) {
        parentItem = routeSnapshot.data.item;
        break;
      }
      routeSnapshot = routeSnapshot.parent;
    } while (routeSnapshot);
    return parentItem;
  }

  public getParentRouteItemId(): string {
    let routeSnapshot = this.route.snapshot;
    let parentItemId: string;
    do {
      if (
        routeSnapshot.data &&
        routeSnapshot.data.mraLevel === 1 &&
        'id' in routeSnapshot.params
      ) {
        parentItemId = routeSnapshot.params.id;
        break;
      }
      routeSnapshot = routeSnapshot.parent;
    } while (routeSnapshot);
    return parentItemId;
  }

  public getParentRouteRefField(): string {
    const mp = this.referenceFieldsMap;
    for (const prop in mp) {
      if (mp.hasOwnProperty(prop) && mp[prop] === this.parentItem) {
        return prop;
      }
    }
  }

  public getParentActivatedRouter(): ActivatedRoute {
    let route = this.route;
    do {
      const data = route.snapshot.data;
      // all route inside the mra system will have mraLevel data item
      if (!data.mraLevel) {
        return route;
      }
      route = route.parent;
    } while (route);
    return this.route.root;
  }

  public isChildRouterActivated(): boolean {
    if (!this.route) {
      return undefined;
    }
    const routeSnapshot = this.route.snapshot;

    if (routeSnapshot.firstChild) {
      return true;
    }
    return false;
  }

  public isEmptyRoutingPath(): boolean {
    return this.route.snapshot.url.length === 0;
  }

  /*Sub detail show flag*/
  public toggleCheckedItem(i: number): void {
    this.checkedItem[i] = !this.checkedItem[i];
  }

  toggleShowDetailItem(i: number): void {
    this.list[i].mddsShowDetail = !this.list[i].mddsShowDetail;
  }

  public onEmbeddedAdd() {
    this.isAdding = true;
  }
  public onEmbeddedEdit(id: string) {
    this.isEditing = true;
    this.parentId = id;
  }
  public onEmbeddedEditDone(result: boolean) {
    this.isAdding = false;
    this.isEditing = false;
    if (result) {
      // add successful. Re-populate the current list
      this.populateList();
    }
  }

  public onEdit(id: string) {
    this.clickedId = id;
    if (this.modulePath) {
      this.router.navigate([this.modulePath, this.schemaName, 'edit', id]); // {relativeTo: this.getParentActivatedRouter() }
    } else {
      this.router.navigate([this.itemName, 'edit', id], {
        relativeTo: this.getParentActivatedRouter(),
      });
    }
  }
  /***general action handling from angular-action-base */
  public onActionBaseEvent(event: {
    actionType: any;
    actionData: any;
    succMessage: any;
    resultFields: any;
  }) {
    // event in {actitonType, actionData, succMessage} format
    const { actionType, actionData, succMessage, resultFields } = event;
    this.onActionBase(actionType, actionData, succMessage, resultFields);
  }

  onDateSelectionToggle(fn: string) {
    this.detail[fn].pop = !this.detail[fn].pop;
  }

  onDateSelection(fn: string, date: any) {
    if (!this.detail[fn].from && !this.detail[fn].to) {
      this.detail[fn].from = date;
    } else if (
      this.detail[fn].from &&
      !this.detail[fn].to &&
      date.after(this.detail[fn].from)
    ) {
      this.detail[fn].to = date;
      this.detail[fn].pop = false; // Finished. hide the selection
    } else {
      this.detail[fn].to = null;
      this.detail[fn].from = date;
    }
  }

  isHovered(fn: string, date: any) {
    return (
      this.detail[fn].from &&
      !this.detail[fn].to &&
      this.hoveredDate &&
      date.after(this.detail[fn].from) &&
      date.before(this.hoveredDate)
    );
  }

  isInside(fn: string, date: any) {
    return date.after(this.detail[fn].from) && date.before(this.detail[fn].to);
  }

  isRange(fn: string, date: any) {
    return (
      date.equals(this.detail[fn].from) ||
      date.equals(this.detail[fn].to) ||
      this.isInside(fn, date) ||
      this.isHovered(fn, date)
    );
  }
}
