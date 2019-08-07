import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Injector, EventEmitter } from '@angular/core';

import { Location } from '@angular/common';

import { Observable, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ModalConfig, Modal} from './util.modal';
import { SnackBarConfig, SnackBar} from './util.snackbar';
import { ErrorToastConfig, ErrorToast} from './util.errortoast';

import { BaseService, ServiceError } from './base.service';
import { MraCommonService } from './common.service';
import { BaseComponentInterface } from './base.interface';
import { Util } from './util.tools';

export enum ViewType {
    LIST,
    DETAIL,
    EDIT,
}

export {ServiceError};

export class BaseComponent implements BaseComponentInterface {
    public objectKeys = Object.keys;
  
    public storage:any = {};

    //For list and pagination
    public list:any[] = [];
    public originalList:any[] = [];
        
    public majorUi = true;
    public modulePath:string;
    public eventEmitter: EventEmitter<any> = new EventEmitter();
    
    public page: number = 1;
    public per_page: number = 25;
    public total_count: number = 0;
    public total_pages: number = 0;
    
    public new_page;
    
    public pages: number[] = [];
    public left_more:boolean = false;
    public right_more:boolean = false;

    public checkAll = false;
    //used to mark deleted items, or items that will show sub-detail, etc.
    public checkedItem:boolean[] = [];
    
    //For edit and view details
    public detail:any = {};
    public _detail:any = {}; //a clone and used to send/receive from next work
    public _extra:any = {}; //extra info.
    public id:string;
    public embeddedView = false; //a edit-sub component
    //for fields with enum values
    public enums:any = {};
    public stringFields = [];
    public referenceFields: string[] = [];
    public referenceFieldsMap = {}; // refField: refSchema
    public referenceFieldsReverseMap = {}; // refSchema: refField
    public dateFields = [];
    public indexFields = [];
    public multiSelectionFields = [];
    public arrayFields = []; //element is [fieldName, elementType]
    public mapFields = []; //element is [fieldName, elementType, mapKey]
    public fileFields = {}; //fieldName: {selectedFiles: [selected files]}
    public textareaFields = [];
    public dateFormat = "MM/DD/YYYY";
    public timeFormat = "hh:mm:ss";

    public briefFieldsInfo = []; //from base contructor. All breifFields

    public listViewFilter = 'table'; // list, or grid
    public listSortField: string;
    public listSortFieldDisplay: string;
    public listSortOrder: string; // 'asc', 'desc'
    public categoryBy: string; // field whose value is used as category
    public listCategoryShowMore: string = undefined; // show more info for the category (if category is ref)
    public categories: [] = []; // stored categories
    public categoryMore: [] = []; //stored more details
    public categoryDisplays: string[] = []; //stored display name of categories
    public selectedCategory: number = undefined; // index in categories

    public hiddenFields = []; //fields hide from view. Currrently used by "Add" view of edit-sub
    public viewHiddenFields = []; //fields hidden from view. Hidden is defined in schema view with ()

    public ItemCamelName: string;
    public itemName: string;
    public parentItem: string;
    public schemaName: string;

    public refreshing: boolean = false;

    public commonService: MraCommonService;

    public loaded: boolean = false;

    // actions (pipeline/composite)
    public isDropdownList: boolean = false;
    public dropdownItems: {displayName: string, id: string}[];
    public actionType: string;

    // search bar
    public searchDetailReady: boolean; // when search is provided by input data, instead of from search bar;
    public searchText: string;
    public searchMoreDetail: any;
    public moreSearchOpened:boolean = false;

    //windows width adjust for list (replace table view, which is not good for narrow screen)
    public widowWidth: number = 600;

    // to show more details of the associationed field (an object) from list view
    public associationField;

    constructor(
        public service: BaseService,
        public injector: Injector,
        public router: Router,
        public route: ActivatedRoute,
        public location: Location,
        public view: ViewType,
        public itemCamelName: string) {
      
        this.ItemCamelName = itemCamelName.charAt(0).toUpperCase() + itemCamelName.substr(1);
        this.itemName = itemCamelName.toLowerCase();
        this.parentItem = this.getParentRouteItem();
        if (injector) {
            this.commonService = injector.get(MraCommonService);
        }
    }
    
    public onServiceError(error:ServiceError):void {
        //clear any pending flags
        this.refreshing = false;
      
        let errMsg:string;
        let more:string;
        if (error.clientErrorMsg) {
            errMsg = error.clientErrorMsg;
        }
        else if (error.serverError) {
            if (error.status == 401)  return; //Don't show unauthorized error
            if (typeof error.serverError === 'object') {
                errMsg = error.status + ": " + JSON.stringify(error.serverError);
            } else {
                errMsg = error.status + ": " +error.serverError;
            }
        }
        console.info("Error: " + errMsg);
        if (!errMsg) errMsg = "Unknown error.";
        if (errMsg.length > 80) {
            more = errMsg;
            errMsg = errMsg.substring(0, 80) + "...";
        }
        let errorToastConfig: ErrorToastConfig = {
            content: errMsg,
            more: more
        }
        let errorToast = new ErrorToast(errorToastConfig);
        errorToast.show();
        
        this.loaded = true;
    }

    public populatePages():void {        
        this.pages = []
        const SHOW_PAGE = 9;
        const HALF = (SHOW_PAGE-1)/2;
        
        let min, max;
        if (this.total_pages <= SHOW_PAGE) {
            min = 1;
            max = this.total_pages;
            this.left_more = false; 
            this.right_more = false;
        } else {
            if (this.page - 1 < HALF) {
                min = 1;
                max = SHOW_PAGE-1;
                this.left_more = false; 
                this.right_more = true;
            } else if (this.total_pages - this.page < HALF) {
                max = this.total_pages;
                min = (this.total_pages - SHOW_PAGE + 1) + 1;
                this.left_more = true; 
                this.right_more = false;
            } else {
                min = this.page - HALF + 1;
                max = this.page + HALF - 1;
                this.left_more = true; 
                this.right_more = true;
            }
        }
        for (let i = min; i <= max; i++) {
            this.pages.push(i);
        }
    }
    
    private getKey(key:string):string {
        let url = this.router.url.split(';')[0].split('?')[0];
        return url+ ":" + key;
    }
    private putToStorage(key:string, value:any):void {
        if (this.majorUi) {
            //only major UI we want to cache and recover when user comes back
            this.commonService.putToStorage(this.getKey(key), value);
        } else {
            this.storage[key] = value;
        }
    }
    private getFromStorage(key:string):any {
        if (this.majorUi) {
            return this.commonService.getFromStorage(this.getKey(key));
        } else {
            return this.storage[key];
        }
    }
    private routeToPage(page:number):void {
        this.putToStorage("page", page);
        this.populateList();
    }
    
    public onNextPage():void {
        if (this.page >= this.total_pages) return;
        this.routeToPage(this.page + 1);
    }
    
    public onPreviousPage():void {
        if (this.page <= 1) return;
        this.routeToPage(this.page - 1);
    }

    public onGotoPage(p:number):void {
        if (p > this.total_pages || p < 1) return;
        this.routeToPage(p)
    }
    
    public goBack() {
        this.location.back();
        /*
        // window.history.back();
        if (this.view != ViewType.EDIT)
            this.location.back();
        else {
            let url = this.location.path(); //in EDIT view, the current url is skipped. So get the "previous" one from path.
            this.router.navigateByUrl(url);
        }
        */
    }
    
    public adjustListViewForWindowSize() {
        this.widowWidth = window.innerWidth;
        if (this.widowWidth < 600) {
            if (this.listViewFilter === 'table') {
                this.listViewFilter = 'list'; //use list instead
            }
        }
    }

    public stringify(detail:any): string {
        let str = "";
        for (let fnm of this.indexFields) {
            if (detail[fnm] && typeof detail[fnm] != 'object') str += " " + detail[fnm];
        }
        if (!str)  {
            for (let prop in detail) {
                if (prop !== '_id' && detail[prop] && typeof detail[prop] != 'object') {
                    str += " " + detail[prop];
                }
            }
        }
        if (!str) str = detail["_id"]?detail["_id"]:"..."
        str = str.replace(/^\s+|\s+$/g, '')
        if (str.length > 30) str = str.substr(0, 27) + '...';
        return str;
    }

    /***Start: handle textarea fields***/
    public formatTextareaFields(detail: any): any {
        for (let fnm of this.textareaFields) {
            if (detail[fnm]) {
                detail[fnm] = detail[fnm].replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>');
            }
        }
        return detail;
    }
    /***Start: handle reference fields***/
    public formatReferenceField(field: any, fieldName: string ):any {
        let id, value;
        if (typeof field == 'string') {
            //assume this is the "_id", let see we have the cached details for this ref from service
            let refDetail = this.commonService.getFromStorage(field);
            if (refDetail && (typeof refDetail == 'object')) field = refDetail;
            else {
                id = field;
                field = {'_id': id};
            }
        } else if (field && (typeof field == 'object') ) {
            id = field['_id'];
            let referIndex = '';
            for (let k in  field) {
                if (k != '_id') referIndex += " " + field[k];
            }
            referIndex = referIndex.replace(/^\s+|\s+$/g, '');
            if (referIndex.length >= 20) referIndex = referIndex.substring(0, 20) + "...";
            field = {'_id': id, 'value': referIndex? referIndex: fieldName};
        } else {//not defined
            field = {'_id': id, 'value': value};
        }
        return field;
    }
    public formatReference(detail:any ):any {
        for (let fnm of this.referenceFields) {
            detail[fnm] = this.formatReferenceField(detail[fnm], fnm);
        }
        return detail;
    }
    public deFormatReference(detail:any ):any {
        for (let fnm of this.referenceFields) {
            if (typeof detail[fnm] !== 'object') { //not defined
                //let date values undefined
                delete detail[fnm];
            } else {
                let id = detail[fnm]['_id'];
                if (typeof id !== 'string') delete detail[fnm];
                else detail[fnm] = id;
            }
        }
        return detail;
    }
    
    public clearFieldReference(field:any ):any {
        for (let prop in field) {
            field[prop] = undefined;
        }
        return field;
    }

    public isDefinedFieldReference(field:any ):any {
        if ('_id' in field && typeof field['_id'] == 'string') return true;
        return false;
    }
    /***Start: handle date fields***/    
    public formatDateField(field:string):any {
        let fmt = this.dateFormat;
        let t_fmt = this.timeFormat;
        let d, M, yyyy, h, m, s;

        let dt = new Date(field);
        
        let dd, MM, hh, mm, ss;
        d = dt.getDate();
        M = dt.getMonth()+1; 
        yyyy = dt.getFullYear();
        
        let yy = yyyy.toString().slice(2);
        h = dt.getHours();
        m = dt.getMinutes();
        s = dt.getSeconds();
        
        dd= d<10? '0'+d: d.toString();
        MM= M<10? '0'+M: M.toString();
        hh= h<10? '0'+h: h.toString();
        mm= m<10? '0'+m: m.toString();
        ss= s<10? '0'+s: s.toString();
        
        let value = fmt.replace(/yyyy/ig, yyyy.toString()).
                       replace(/yy/ig, yy.toString()).
                       replace(/MM/g, MM.toString()).
                       replace(/dd/ig, dd.toString());
      
        let t_value = t_fmt.replace(/hh/ig, hh.toString()).
                       replace(/mm/g, mm.toString()).
                       replace(/ss/ig, ss.toString());
        /*Datepicker uses NgbDateStruct as a model and not the native Date object. 
        It's a simple data structure with 3 fields. Also note that months start with 1 (as in ISO 8601).
        
        we add h, m, s here
        */
        //"from" and "to" used for search context. pop: show the selection popup
        return {'date':{ day: d, month: M, year: yyyy}, 'value': value, 'from': undefined, 'to': undefined, 'pop':false,
                'time':{ hour: h, minute: m, second: s}, 't_value': value, 't_from': undefined, 't_to': undefined, 't_pop':false}

    }
    
    public formatDate(detail:any ):any {
        for (let fnm of this.dateFields) {
            let value, date;
            if (typeof detail[fnm] !== 'string') { //not defined
                //important: let date values undefined. "from" and "to" used for search context. pop: show the selection popup
                detail[fnm] = {'date':undefined, 'value': undefined, 'from': undefined, 'to': undefined, 'pop':false};
            }
            else {
                detail[fnm] = this.formatDateField(detail[fnm]);
            }
        }
        return detail;
    }
    
    public deFormatDateField(date:any):string {
        let d, M, yyyy, h, m, s;
        
        yyyy = date.year;
        M = date.month - 1;
        d = date.day;
        
        if (typeof yyyy !== 'number' || typeof M !== 'number' || typeof d !== 'number') return null;
        else {
            let dt = new Date(yyyy, M, d, 0, 0, 0, 0);
            return dt.toISOString();
        }
    }
    
    public deFormatDate(detail:any ):any {
        for (let fnm of this.dateFields) {
            let value;
            if (typeof detail[fnm] !== 'object') { //not defined
                //let date values undefined
                delete detail[fnm];
            }
            else {
                if (! detail[fnm].date) delete detail[fnm];
                else {
                    let dateStr = this.deFormatDateField(detail[fnm].date);
                    if (!dateStr) delete detail[fnm];
                    else detail[fnm] = dateStr;
                }
            }
        }
        return detail;
    }
    public clearFieldDate(field:any ):any {
        for (let prop in field) {
            field[prop] = undefined;
        }
        return field;
    }
    public isDefinedFieldDate(field:any ):any {
        if (typeof field === 'object') {
                if (typeof field['date'] == 'object') return true;
                if (typeof field['from'] == 'object') return true;
                if (typeof field['to'] == 'object') return true;
        }
        return false;
    }

    /***Start: handle array of multi-selection fields***/
    public formatArrayMultiSelectionField(field: any, enums: any): any {
        let selectObj = {};
        let value = "";
        for (let e of enums) {
            selectObj[e] = false; //not exist
        }
        if (Array.isArray(field)) { //not defined
            for (let e of field) {
                selectObj[e] = true;  //exist.
            }
            value = field.join(" | ")
        }
        return {'selection': selectObj, value: value};

    }
    public formatArrayMultiSelection(detail:any ):any {
        for (let fnm of this.multiSelectionFields) {
            detail[fnm] = this.formatArrayMultiSelectionField(detail[fnm], this.enums[fnm]);
        }
        return detail;
    }
    
    public deFormatArrayMultiSelection(detail:any ):any {
        for (let fnm of this.multiSelectionFields) {
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (! detail[fnm].selection) delete detail[fnm];
                else {
                    let selectArray = [];
                    for (let e of this.enums[fnm]) {
                        if (detail[fnm].selection[e]) selectArray.push(e);
                    }

                    if (selectArray.length > 0) detail[fnm] = selectArray;
                    else delete detail[fnm];
                }
            }
        }
        return detail;
    }
    public clearFieldArrayMultiSelection(field:any ):any {
        if (!field['selection']) return field;
        for (let prop in field['selection']) {
            field['selection'][prop] = false; //not exist
        }
        return field;
    }

    public isDefinedFieldArrayMultiSelection(field:any ):any {
        if ('selection' in field && typeof field['selection'] == 'object') {
            let keys = Object.keys(field['selection']);
            return keys.some(e=>{return field['selection'][e]});
        }
        return false;
    }
    public multiselectionSelected(fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldArrayMultiSelection(this.detail[fieldName]);
    }
    /***End: handle array of multi-selection fields***/
    /***Start: handle map fields***/
    public formatMapField(field: any, elementType: string): any {
        let selectObj = {};
        let values = [];
        if (typeof field == 'object') {
            selectObj = field;
            for (let e in field) {
              if (elementType === 'SchemaString') {
                values.push(e + "(" + field[e] + ")");
              }
            }
        }
        values = values.filter(x=>!!x);
        let value = values.join(" | ")
        return {'selection': selectObj, value: value, keys: []};

    }
    public formatMapFields(detail:any ):any {
        for (let f of this.mapFields) {
            //[fieldName, elementType]
            detail[f[0]] = this.formatMapField(detail[f[0]], f[1]);
        }
        return detail;
    }

    public deFormatMapFields(detail:any ):any {
        for (let f of this.mapFields) {
            //[fieldName, elementType]
            let fnm = f[0];
            let elementType = f[1];
          
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (! detail[fnm].selection) delete detail[fnm];
                else {
                    let selectMap = detail[fnm].selection;
                    for (let e in detail[fnm].selection) {
                      if (elementType === 'SchemaString') {
                        ;
                      }
                    }

                    if (Object.keys(selectMap).length > 0) detail[fnm] = selectMap;
                    else delete detail[fnm];
                }
            }
        }
        return detail;
    }

    public clearFieldMap(field:any ):any {
        if (!field['selection']) return field;
        field['selection'] = {};
        field.value = undefined;
        return field;
    }

    public isDefinedFieldMap(field:any ):any {
        if ('selection' in field && typeof field['selection'] == 'object') {
            return Object.keys(field['selection']).length > 0;
        }
        return false;
    }
    public mapSelected(fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldMap(this.detail[fieldName]);
    }
    /***End: handle map fields***/
    /***Start: handle array fields***/
    public formatArrayField(field: any, elementType: string): any {
        let selectArray = [];
        let values = [];
        if (Array.isArray(field)) { //not defined
            for (let e of field) {
              if (elementType === 'ObjectId') {
                let ref = this.formatReferenceField(e, "...");
                selectArray.push(ref);
                values.push(ref.value);
              } else if (elementType === 'SchemaString') {
                selectArray.push(e);
                values.push(e);
              }
            }
        }
        values = values.filter(x=>!!x);
        let value = values.join(" | ")
        return {'selection': selectArray, value: value};

    }
    public formatArrayFields(detail:any ):any {
        for (let f of this.arrayFields) {
            //[fieldName, elementType]
            detail[f[0]] = this.formatArrayField(detail[f[0]], f[1]);
        }
        return detail;
    }

    public deFormatArrayFields(detail:any ):any {
        for (let f of this.arrayFields) {
            //[fieldName, elementType]
            let fnm = f[0];
            let elementType = f[1];
          
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (! detail[fnm].selection) delete detail[fnm];
                else {
                    let selectArray = [];
                    for (let e of detail[fnm].selection) {
                      if (elementType === 'ObjectId') {
                        if (e && e['_id'] && typeof e['_id'] === 'string') selectArray.push(e['_id']);
                      } else if (elementType === 'SchemaString') {
                        if (e) selectArray.push(e);
                      }
                    }

                    if (selectArray.length > 0) detail[fnm] = selectArray;
                    else delete detail[fnm];
                }
            }
        }
        return detail;
    }

    public clearFieldArray(field:any ):any {
        if (!field['selection']) return field;
        field['selection'] = [];
        field.value = undefined;
        return field;
    }

    public isDefinedFieldArray(field:any ):any {
        if ('selection' in field && Array.isArray(field['selection'])) {
            return field['selection'].length > 0;
        }
        return false;
    }
    public arraySelected(fieldName) {
        if (!this.detail[fieldName] || !Array.isArray(this.detail[fieldName]['selection'])) {
            return false;
        }
        return this.isDefinedFieldArray(this.detail[fieldName]);
    }
    /***End: handle array fields***/
  
    public formatDetail(detail:any ):any {
        let cpy = Util.clone(detail);

        cpy = this.formatReference(cpy);
        cpy = this.formatDate(cpy);
        cpy = this.formatArrayMultiSelection(cpy);
        cpy = this.formatArrayFields(cpy);
        cpy = this.formatMapFields(cpy);
        cpy = this.formatTextareaFields(cpy);
        return cpy;
    }

    public stringifyField(field: any):string {
        let str = '';

        if (!field) return str;
        if (typeof field === 'number' || typeof field === 'string' || typeof field === 'boolean' || typeof field === 'bigint') return String(field);
        if (typeof field === 'object' && Array.isArray(field)) {
            for (let e of field) {
                str += ' | ' + this.stringifyField(e);
            }
            return str;
        }
        if (typeof field === 'object') {
            return field.value || field._id || ''
        }
        return str;
    }
    public getFieldDisplayFromFormattedDetail(detail:any, fieldName:string):string {
        if (typeof detail !== 'object') return '';
        return this.stringifyField(detail[fieldName]);
    }
    
    public deFormatDetail(detail:any ):any {
        let cpy = Util.clone(detail);
        
        cpy = this.deFormatReference(cpy);
        cpy = this.deFormatDate(cpy);
        cpy = this.deFormatArrayMultiSelection(cpy);
        cpy = this.deFormatArrayFields(cpy);
        cpy = this.deFormatMapFields(cpy);
        return cpy;
    }
    
    public populateDetail(id: string):EventEmitter<any> {
      return this.populateDetailForAction(id, null);
    }

    public onDetailReturned(detail: any, action: string): void {
        let originalDetail = Util.clone(detail);
        if (detail["_id"]) this.commonService.putToStorage(detail["_id"], originalDetail);//cache it
        
        this.detail = this.formatDetail(detail);
        this.extraFieldsUnload(this.detail);//unload data to text editors, etc
        if (action == 'edit') {
          this.extraInfoPopulate();//collect other info required for edit view
        }
        if (this.refreshing) {
          this.refreshing = false;
          let snackBarConfig: SnackBarConfig = {
              content: "Detail refreshed"
          }
          let snackBar = new SnackBar(snackBarConfig);
          snackBar.show();
        }
        this.loaded = true;
        this.eventEmitter.emit({
            type: 'detail',
            result: this.detail
        });
    }

    public populateDetailByFields(searchObj: any):EventEmitter<any> {
        let searchContext = {'$and': [
            {'$or': []},
            {'$and': []},
        ]};

        for (let field in searchObj) {
            let o = {}
            o[field] = searchObj[field];
            searchContext['$and'][1]['$and'].push(o);
        }
        let expt = false;
        this.service.getList(1, 1, searchContext, null, null, null, false, false, null, expt, this.ignoreField).subscribe(
            result => {
                let detail = {};
                if (result.items && result.items.length >= 1) {
                    detail = result.items[0];
                }
                let action = null;
                this.onDetailReturned(detail, action);
            },
            this.onServiceError
        );
        return this.eventEmitter;
    }

    public populateDetailForAction(id: string, action: string):EventEmitter<any> {
      //action: eg: action=edit  -> get detail for editing purpose 
      this.service.getDetailForAction(id, action).subscribe(
        detail => {
            this.onDetailReturned(detail, action);
        },
        this.onServiceError
      );
      return this.eventEmitter;
    }

    public populateDetailFromCopy(copy_id:string):void {
      this.service.getDetail(copy_id).subscribe(
        detail => {            
            this.detail = this.formatDetail(detail);
            delete this.detail["_id"];
            this.extraFieldsUnload(this.detail);//unload data to text editors, etc
            this.extraInfoPopulate();//collect other info required for create view
        },
        this.onServiceError
      );
    }

    public extraInfoPopulate() {
        for (let fieldDef of this.mapFields) { 
          //fieldDef: [field.fieldName, field.elementType, keyType, keyRefName, keyRefService, keyRefSubField]
          let fieldName = fieldDef[0]; //this.<keyRefName>.<keyRefSubField>
          let mapKeyType = fieldDef[2]; //this.<keyRefName>.<keyRefSubField>
          let keyArray = [];
          if (mapKeyType == "ObjectId") {
            let keyRefName = fieldDef[3];
            let recordKey = 'key-id-' + keyRefName;
            let refService = this.injector.get(fieldDef[4]);
            let id = this.detail[keyRefName]?this.detail[keyRefName]['_id'] : undefined;
            if (!id) continue;
            let mapField = this.detail[fieldName];
            if (mapField[recordKey] == id) continue; //already populated for the same id
            
            refService.getDetail(id).subscribe(
              detail => {
                if (Array.isArray(detail[fieldDef[5]])) {
                  keyArray = detail[fieldDef[5]];
                  mapField['keys'] = keyArray;
                  mapField[recordKey] = id; //record that keys is populated from this object
                  if (mapField['selection']) {
                    for (let k of keyArray) {
                      if (!(k in mapField['selection'])) mapField['selection'][k] = "";
                    }
                  }
                }
              },
              this.onServiceError
            );
          }          
        }
    }

    public categorySelected(idx: number) {
        let selectedValue = this.categories[idx];
        this.selectedCategory = idx;

        this.searchList();
    }
  
    private equalTwoSearchContextArrays (arr1, arr2) {
      if (!arr1) arr1 = [];
      if (!arr2) arr2 = [];
      if (arr1.length == 0 && arr2.length == 0) return true;
      //all object in array has format of {'field': 'value'} format
      function compareObj(a, b) {
          let a_s = JSON.stringify(a), b_s = JSON.stringify(b)
          if (a_s < b_s)
              return -1;
          if (a_s > b_s)
              return 1;
          return 0;
      }
      arr1 = arr1.sort(compareObj);
      arr2 = arr2.sort(compareObj);
      if (JSON.stringify(arr1) == JSON.stringify(arr2)) return true;
      return false;
    }

    public processSearchContext() {
        this.moreSearchOpened = false;
        let d = this.detail;
    
        if (typeof this.selectedCategory == 'number') {
            d[this.categoryBy] = this.categories[this.selectedCategory][this.categoryBy];
        }

        if (!this.searchDetailReady) {
            for (let s of this.stringFields) {
                if (s !== this.categoryBy) {
                    d[s] = this.searchText;
                }
            }
        }
        let orSearchContext = [], andSearchContext = [];
        for (let field in d) {
            if (typeof d[field] == 'string' && field !== this.categoryBy) { //this.categoryBy will be put to 'and' context
                let o = {}
                o[field] = d[field];
                orSearchContext.push(o);
            }
        }
        
        this.searchMoreDetail = []
        let d2 = this.deFormatDetail(d);//undefined field is deleted after this step
        for (let field in d2) {
            if (this.stringFields.indexOf(field) >= 0 && field === this.categoryBy) { // put category field to "and"
                let o = {};
                o[field] = d[field];
                andSearchContext.push(o);
            }
            if (this.stringFields.indexOf(field) == -1) {//string fields already put to orSearchContext
                let o = {}
                let valueToShow;

                o[field] = d2[field];

                if (this.multiSelectionFields.includes(field)) {
                    o[field] = {$in: d2[field]}; //use $in for or, and $all for and

                    let t = this.formatArrayMultiSelectionField(d2[field], this.enums[field]);
                    valueToShow = t.value;
                } else if (this.arrayFields.some(x=>x[0] == field)) {                  
                    o[field] = {$in: d2[field]}; //use $in for or, and $all for and
                  
                    valueToShow = d[field]['value'];
                } else if (this.dateFields.includes(field)) {
                    let t = this.formatDateField(d2[field]);
                    valueToShow = t.value;
                } else if (this.referenceFields.includes(field)) {
                    valueToShow = valueToShow = d[field]['value'];
                } else {
                    valueToShow = d[field];//take directoy from what we get 
                }
                if (field !== this.categoryBy) { // don't show category field
                    this.searchMoreDetail.push([field, valueToShow]);
                }
                andSearchContext.push(o);
            }
        }
        //Handle date range selection. These fields are not in d2, because field.date is undefined.
        for (let prop of this.dateFields) {
            let o = {};
            let valueToShow = "";
            
            o[prop] = {};
            if (typeof d[prop] !== 'object') { //not defined
                continue;
            }
            if (!d[prop]['from'] && !d[prop]['to']) { //not range
                continue;
            }
            if (d[prop]['from']) {
                o[prop]['from'] = this.deFormatDateField(d[prop]['from']);
                valueToShow += this.formatDateField(o[prop]['from']).value;
            }
            valueToShow += " ~ ";
            if (d[prop]['to']) {
                o[prop]['to'] = this.deFormatDateField(d[prop]['to']);
                valueToShow += this.formatDateField(o[prop]['to']).value;
            }
            this.searchMoreDetail.push([prop, valueToShow]);
            andSearchContext.push(o);
        }

        let searchContext = {'$and': [{'$or': orSearchContext},{'$and': andSearchContext}]};
        /* searchContext ={'$and', [{'$or', []},{'$and', []}]}
        */
        let context = this.getFromStorage("searchContext");
        if (context && context["$and"]) {
            let cachedOr, cachedAnd;
            for (let sub of context["$and"]) {
                if ('$and' in sub) cachedAnd = sub['$and'];
                else if ('$or' in sub) cachedOr = sub['$or'];
            }
            if (this.equalTwoSearchContextArrays(cachedOr, orSearchContext) 
                && this.equalTwoSearchContextArrays(cachedAnd, andSearchContext)) {
                return;
            }
        } 
        
        if (orSearchContext.length == 0 && andSearchContext.length == 0) searchContext = null;
        this.putToStorage("searchContext", searchContext);
        this.putToStorage("searchText", this.searchText);
        this.putToStorage("page", 1);//start from 1st page
        this.putToStorage("searchMoreDetail", this.searchMoreDetail);
        this.putToStorage("detail", this.detail);
    }
    public  searchList():EventEmitter<any>  {
        this.processSearchContext();
        //update the URL
        if (!this.isEmptyRoutingPath()) {
            this.router.navigate(['.', {}], {relativeTo: this.route, queryParamsHandling: 'preserve',});//start from 1st page
        }
        this.putToStorage("page", 1);//start from 1st page
        return this.populateList();
    }
    public loadUIFromCache():void {
        //Now let's reload the search condition to UI
        this.searchText = this.getFromStorage("searchText");
        this.searchMoreDetail = this.getFromStorage("searchMoreDetail");
        this.listSortField = this.getFromStorage('listSortField');
        this.listSortFieldDisplay = this.getFromStorage('listSortFieldDisplay');
        this.listSortOrder = this.getFromStorage('listSortOrder');

        let detail = this.getFromStorage("detail");
        if (detail) this.detail = detail;
    }
    
    public populateList():EventEmitter<any> {
        //First let's handle page
        let new_page;
        let searchContext, searchText;

        let url_page = parseInt(this.route.snapshot.paramMap.get('page'));
        let cached_page = parseInt(this.getFromStorage("page"));
            
        if (cached_page) { 
            new_page = cached_page;
            if (!this.isEmptyRoutingPath()) {
                if (cached_page == 1)
                this.router.navigate(['.', {}], {relativeTo: this.route, queryParamsHandling: 'preserve',});//update the url
            else
                this.router.navigate(['.', {page: cached_page}], {relativeTo: this.route, queryParamsHandling: 'preserve',});//update the url
            }
        }
        else if (url_page) new_page = url_page;
        else new_page = 1;

        searchContext = this.getFromStorage("searchContext");
        this.loadUIFromCache();

        const categoryProvided = typeof this.selectedCategory === 'number'? true : false;
        const listCategoryShowMore = typeof this.listCategoryShowMore? true : false;
        let expt = false;
        this.service.getList(new_page, this.per_page, searchContext, this.listSortField, this.listSortOrder, 
            this.categoryBy, listCategoryShowMore, categoryProvided, this.associationField, expt, this.ignoreField).subscribe(
          result => { 
            this.list = result.items.map(x=> {
                let d = this.formatDetail(x);
                return d;
            });
            this.originalList = result.items;

            if (this.categoryBy && !categoryProvided) {
                this.categories = result.categories.map(x=>this.formatDetail(x));
                this.selectedCategory = 0;

                //categories is a array of this.detail format with the this.categoryBy field only
                this.categoryDisplays = this.categories.map(x=>this.getFieldDisplayFromFormattedDetail(x, this.categoryBy));
                //categoriesBrief is array of object of the category ref
                this.categoryMore = result.categoriesBrief;
            }

            if (this.isDropdownList) {
                this.dropdownItems = this.list.map(x=> { return {displayName: this.stringify(x), id: x._id}} );
            }
            this.page = result.page;
            this.per_page = result.per_page;
            this.total_count = result.total_count;
            this.total_pages = result.total_pages;
            this.populatePages();
            
            this.checkedItem = 
                Array.apply(null, Array(this.list.length)).map(Boolean.prototype.valueOf,false);
            this.checkAll = false;
            
            if (this.refreshing) {
              this.refreshing = false;
              let snackBarConfig: SnackBarConfig = {
                  content: "List refreshed"
              }
              let snackBar = new SnackBar(snackBarConfig);
              snackBar.show();
            }
            this.eventEmitter.emit({
                type: 'list',
                result: this.list
            });
            this.loaded = true;
          },
          this.onServiceError
        );
      return this.eventEmitter;
    }

    /*UI operations handlers*/
    public setListViewFilter(view: string):void {
        this.listViewFilter = view;
        this.putToStorage('listViewFilter', view);
    }
    public isShowListView(view: string):boolean {
        const cached = this.getFromStorage('listViewFilter');
        return cached ? cached === view : this.listViewFilter === view;
    }
    public setListSort(field:string, fieldDisplay:string, order:string): boolean {
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
    public setListSortAndRefresh(field:string, fieldDisplay:string, order:string): void {
        let refresh = this.setListSort(field, fieldDisplay, order);
        if (refresh) this.searchList(); // call search list, instead of populate list, in case there are other search context.
    }
    public toggleListSort(field:string, fieldDisplay:string): void {
        if (field !== this.listSortField) {
            this.listSortOrder = 'asc';
        } else {
            if (this.listSortOrder === 'asc') this.listSortOrder = 'desc';
            else this.listSortOrder = 'asc';
        }
        this.setListSort(field, fieldDisplay, this.listSortOrder);

        this.populateList(); 
    }

    public onRefresh():void {
        if (this.view == ViewType.LIST) {
          this.refreshing = true;
          this.populateList();
        } else if (this.view == ViewType.DETAIL) {
          this.refreshing = true;
          if (!this.id) this.id = this.route.snapshot.paramMap.get('id');
          if (this.id) this.populateDetail(this.id);
          else console.error("Routing error for detail view... no id...");
        }
    }
    
    public exportLink:string;
    public ignoreField; // used for export (send to server)

    public onExport(): void {
        let searchContext = this.getFromStorage("searchContext");
        this.loadUIFromCache();

        const categoryProvided = typeof this.selectedCategory === 'number'? true : false;
        const listCategoryShowMore = typeof this.listCategoryShowMore? true : false;

        let expt = true;
        this.service.getList(0, 0, searchContext, this.listSortField, this.listSortOrder, this.categoryBy, listCategoryShowMore, categoryProvided, this.associationField, expt, this.ignoreField).subscribe(
            data => {
                // xlsx file returned
                const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url= window.URL.createObjectURL(blob);
                window.open(url);
            },
            this.onServiceError
        );
    }

    // for term and condition view
    public termChecked: boolean = false;
    public isTermChecked():boolean {
        return this.termChecked;
    }
    public onTermChecked(): void {
        //no changing value because two binded already
        this.eventEmitter.emit({
            type: 'check',
            result: this.termChecked,
        })
    }

    public onCheckAllChange():void {
        this.checkedItem = 
             Array.apply(null, Array(this.list.length)).
                map(Boolean.prototype.valueOf,this.checkAll);
        
        this.onItemSelected();
    }
    
    public onItemChecked(i: number): void {
        this.checkedItem[i] = !this.checkedItem[i];
        this.onItemSelected();
    }

    public isItemSelected():boolean {
        // single selection or multiple selection
        return this.selectedId || this.checkedItem.some((value)=>{return value;})
    }

    public getSelectedItems():string[] {
        if (this.selectedId) { //single selection
            for (let itm of this.list) {
                if (itm._id === this.selectedId) {
                    return [itm]; 
                }
            }
        }

        const selectedItems = [];
        for (let [indx, ckd] of this.checkedItem.entries()) {
            if (ckd) {
                selectedItems.push(this.list[indx]);
            }
        }
        return selectedItems;
    }

    // triggered by user selection from checkbox or dropdown list
    public onItemSelected() {
        //no changing value because already handled with other function or two way bindings
        this.eventEmitter.emit({
            type: 'selection',
            result: this.getSelectedItems(),
        })
    }

    public onDeleteSelected():void {
        let deletedItem = [];
        this.checkedItem.forEach((value, index) => {
                if (value) {
                    deletedItem.push(this.list[index]["_id"]);
                }
            });
        
        let modalConfig: ModalConfig = {
        title: "Delete Confirmation",
        content: "Are you sure you want to delete selected items from the system?",
        //list of button text
        buttons: ['Delete', 'Cancel'],
        //list of button returns when clicked
        returns: [true, false],
        callBack: (result) => {
            if (result) {
                this.service.deleteManyByIds(deletedItem).subscribe(
                    result => {
                        let snackBarConfig: SnackBarConfig = {
                            content: this.ItemCamelName + " deleted"
                        }
                        let snackBar = new SnackBar(snackBarConfig);
                        snackBar.show();

                        if (this.view != ViewType.LIST)
                            this.router.navigate(['../../list'], {relativeTo: this.route});
                        else {
                            let len = this.checkedItem.length;
                            for (let i = 0; i < len; i++ ) {
                                let idx = len - 1 - i;
                                let value = this.checkedItem[idx];
                                if (value) {
                                    this.list.splice(idx, 1);
                                    this.checkedItem.splice(idx,1);
                                    this.total_count -= 1;
                                }
                            };
                        }
                    },
                    this.onServiceError
                );
            }
          }
        }
      let modal = new Modal(modalConfig);
      modal.show();
    }
    
    public onDelete(id:string, idx: number):void {      
      let modalConfig: ModalConfig = {
        title: "Delete Confirmation",
        content: "Are you sure you want to delete this " + this.itemCamelName + " from the system?",
        //list of button text
        buttons: ['Delete', 'Cancel'],
        //list of button returns when clicked
        returns: [true, false],
        callBack: (result) => {
            if (result) {
                this.service.deleteOne(id).subscribe(
                    result => {
                        let snackBarConfig: SnackBarConfig = {
                            content: this.ItemCamelName + " deleted"
                        }
                        let snackBar = new SnackBar(snackBarConfig);
                        snackBar.show();

                        if (this.view != ViewType.LIST)
                            this.router.navigate(['../../list'], {relativeTo: this.route});
                        else if (idx!=null && this.list) {
                                this.list.splice(idx, 1);
                                this.checkedItem.splice(idx,1);
                                this.total_count -= 1;
                            }
                    },
                    this.onServiceError
                );
            }
        }
      }
      
      let modal = new Modal(modalConfig);
      modal.show();
    }
    
    public onSubmit():void {
      if (!this.extraFieldsLoad()) return; //error from other non ngModel fields;
        
      this._detail = this.deFormatDetail(this.detail);
      if (this.id) {
          this.service.updateOne(this.id, this._detail).subscribe(
            result => {
                var snackBarConfig: SnackBarConfig = {
                    content: this.ItemCamelName + " updated."
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                if (this.embeddedView) {
                    this.done.emit(true);
                } else {
                    this.router.navigate(['../../detail', this.id], {relativeTo: this.route});
                }
            },
            this.onServiceError
          );
      }
      else {
          this.service.createOne(this._detail).subscribe(
            result => {
                let action = this.embeddedView? " added":" created.";

                var snackBarConfig: SnackBarConfig = {
                    content: this.ItemCamelName + action
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                this.id = result["_id"];
                this._detail = result;

                if (this.embeddedView) {
                    this.done.emit(true);
                } else {
                    this.router.navigate(['../detail', this.id], {relativeTo: this.route});
                } 
            },
            this.onServiceError
          );
      }
    }
    
    public editCancel(): void {
        if (this.embeddedView) {
            this.done.emit(false);
        } else {
            this.goBack();
        } 
    }

    public clickedId = null;
    public onDisplayRefClicked(fn:string, detail:any, event:any):void {
        let ref = this.getRefFromField(fn);
        let d = detail;
        
        if (d && d['_id']) {
            if (this.list) {
                for (let item of this.list){
                    if (item[fn] == d) this.clickedId = item['_id'];
                }
            }
            if (this.modulePath) {
                this.router.navigate([this.modulePath, ref, 'detail', d['_id']]); // {relativeTo: this.getParentActivatedRouter() };
            } else {
                this.router.navigate([ref, 'detail', d['_id']], {relativeTo: this.getParentActivatedRouter() });
            }
        }
        if (event) event.stopPropagation();
    }

    public onDetailLinkClicked(id:string):void {
        this.clickedId = id; 
        if (this.modulePath) {
            this.router.navigate([this.modulePath, this.schemaName, 'detail', id]); // {relativeTo: this.getParentActivatedRouter() }
        } else {
            this.router.navigate([this.itemName, 'detail', id], {relativeTo: this.getParentActivatedRouter() });
        }
    }
    
    public getRefFromField(fn:string):string {
        return this.referenceFieldsMap[fn];
    }

    public clearValueFromDetail(field:string):void {
        if (!this.detail.hasOwnProperty(field)) return;
        if (typeof this.detail[field] == 'undefined') return;
        if (typeof this.detail[field] == 'object') {//reference field or date
            if (this.multiSelectionFields.includes(field)) {
                this.detail[field] = this.clearFieldArrayMultiSelection(this.detail[field]);
            } else if (this.arrayFields.some(x=>x[0] == field)) {
                this.detail[field] = this.clearFieldArray(this.detail[field]);
            } else if (this.mapFields.some(x=>x[0] == field)) {
                this.detail[field] = this.clearFieldMap(this.detail[field]);
            } else if (this.dateFields.includes(field)) {
                this.detail[field] = this.clearFieldDate(this.detail[field]);
            } else if (this.referenceFields.includes(field)) {
                this.detail[field] = this.clearFieldReference(this.detail[field]);
            }
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        } else {
            delete this.detail[field];
        }
    }
    public clearValueFromArrayField(field: string, idx: number):void {
        if (this.detail[field]['selection']) {
            this.detail[field]['selection'] = this.detail[field]['selection'].filter((x,i)=> i != idx );
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    }
    public clearValueFromMapField(field: string, key: string):void {
        if (this.detail[field]['selection']) {
            delete this.detail[field]['selection'][key];
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    }
    public clearValueFromMapKey(field: string, key: string):void {
        if (this.detail[field]['selection']) {
            this.detail[field]['selection'][key] = undefined;
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    }
  
    public checkValueDefinedFromDetail(field:string):boolean {
        let d = this.detail;
        if (!d.hasOwnProperty(field)) return false;
        if (typeof d[field] == 'undefined') return false;
        if (typeof this.detail[field] == 'number' 
            || typeof d[field] == 'string'
            || typeof d[field] == 'boolean') return true;
        if (typeof d[field] == 'object') {
            if (this.multiSelectionFields.includes(field)) {
                return this.isDefinedFieldArrayMultiSelection(d[field]);
            } else if (this.arrayFields.some(x=>x[0] == field)) {
                return this.isDefinedFieldArray(d[field]);
            } else if (this.mapFields.some(x=>x[0] == field)) {
                return this.isDefinedFieldMap(d[field]);
            } else if (this.dateFields.includes(field)) {
                return this.isDefinedFieldDate(d[field]);
            } else if (this.referenceFields.includes(field)) {
                return this.isDefinedFieldReference(d[field]);
            }
        }
        return false;
    }

    public clearValueFromDetailAndSearchList(field:string):void {
        this.clearValueFromDetail(field);
        this.searchList();
    }
    
    public onAddArrayItem(fieldName:string) {
        if (this.arrayFields.some(x=>x[0] == fieldName)) {
          if (this.detail[fieldName]['new']) { //where new added item is stored
            let item = this.detail[fieldName]['new'];
            this.detail[fieldName]['new'] = undefined; //clear it
            
            this.detail[fieldName]['selection'].push(item);
          
            let values = [];
            if (this.detail[fieldName]['value']) values = this.detail[fieldName]['value'].split(' | ')
            values.push(item); //display value
            values = values.filter(x=>!!x);
            this.detail[fieldName]['value'] = values.join(' | ');
            
            //see if related info needs to change after the change of this value
            this.extraInfoPopulate();
          }
        }                    
    }
    public onAddMapItem(fieldName:string) {
        if (this.mapFields.some(x=>x[0] == fieldName)) {
          if (this.detail[fieldName]['new']) { //where new added item is stored
            let item = this.detail[fieldName]['new'];
            this.detail[fieldName]['new'] = undefined; //clear it
            
            this.detail[fieldName]['selection'][item] = undefined; //move to selection object
            
            //TODO: this.detail[fieldName]['value'] change
            
            //see if related info needs to change after the change of this value
            this.extraInfoPopulate();
          }
        }                    
    }
    //**** For parent component of modal UI
    public refSelectDirective:any;
    public selectComponents:any; //{fieldName: component-type} format
    public componentFactoryResolver: any; //injected by extended class, if needed.
    public componentSubscription
    public onRefSelect(fieldName:string) {
        if (!this.refSelectDirective) {
          console.warn("No reference directive for field: ", fieldName);
          return;
        }
        let viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        
        if (!this.selectComponents[fieldName]) {
          console.warn("No reference defined for field: ", fieldName);
          return;
        }
        let componentRef = this.selectComponents[fieldName]["componentRef"];
        if (!componentRef) {
            let comType = this.selectComponents[fieldName]["select-type"]
            if (!comType) console.warn("No component type found for reference field ", fieldName);

            let componentFactory = this.componentFactoryResolver.resolveComponentFactory(comType);
            componentRef = viewContainerRef.createComponent(componentFactory);//create and insert in one call
            this.selectComponents[fieldName]["componentRef"] = componentRef;//save it
        } else {
            viewContainerRef.insert(componentRef.hostView);
        }

        let componentInstance = <BaseComponentInterface>componentRef.instance;
        if (this.detail[fieldName]) {
            if (this.referenceFields.includes(fieldName)) {
                componentInstance.inputData = this.detail[fieldName]['_id'];
            }            
        }
        componentInstance.setFocus();

        this.componentSubscription = componentInstance.done.subscribe( (val) => {
            if (val) {
                this.componentSubscription.unsubscribe();
                viewContainerRef.detach(); //only detach. not destroy
            }
            let outputData = componentInstance.outputData;
            if (outputData) {
                switch (outputData.action){
                    case "selected":
                        if (this.arrayFields.some(x=>x[0] == fieldName)) {
                            this.detail[fieldName]['selection'].push( outputData.value);
                          
                            let values = [];
                            if (this.detail[fieldName]['value']) values = this.detail[fieldName]['value'].split(' | ')
                            values.push(outputData.value.value); //display value
                            values = values.filter(x=>!!x);
                            this.detail[fieldName]['value'] = values.join(' | ');
                        } else if (this.referenceFields.includes(fieldName)) {
                            this.detail[fieldName] = outputData.value;
                        }                    
                        //trigger extraInfo populate, once reference changed.
                        this.extraInfoPopulate();
                        break;
                    case "view":
                        this.onRefShow(fieldName, "select", outputData.value);//value is _id
                        break;
                    default:
                        break;
                }                
            }
        });
    }

    public onRefShow(fieldName:string, action:string, id:string) {
        if (!id && this.detail[fieldName]) id = this.detail[fieldName]['_id'];
        if (!id) {
          console.error('Show reference but no id is given.');
          return;
        }
        let viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        
        let detailType = action + "-detail-type"; //eg: select-detail-type, pop-detail-type
        let comType = this.selectComponents[fieldName][detailType]
        if (!comType) {
          console.error("No component type found for: %s", detailType);
          return;
        }
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(comType);
        let componentRef = viewContainerRef.createComponent(componentFactory);//create and insert in one call

        let componentInstance = <BaseComponentInterface>componentRef.instance;
        componentInstance.inputData = id;
        componentInstance.setFocus();
       
        componentInstance.done.subscribe( (val) => {
           if (val) {
               componentInstance.done.unsubscribe();
               viewContainerRef.clear();
           }
           let outputData = componentInstance.outputData;
            if (outputData) {
                switch (outputData.action){
                    case "selected":
                        if (this.arrayFields.some(x=>x[0] == fieldName)) {
                            this.detail[fieldName]['selection'].push( outputData.value);
                          
                            let values = [];
                            if (this.detail[fieldName]['value']) values = this.detail[fieldName]['value'].split(' | ')
                            values.push(outputData.value.value); //display value
                            values = values.filter(x=>!!x);
                            this.detail[fieldName]['value'] = values.join(' | ');
                        } else if (this.referenceFields.includes(fieldName)) {
                            this.detail[fieldName] = outputData.value;
                        }                    
                        //trigger extraInfo populate, once reference changed.
                        this.extraInfoPopulate();
                        break;
                    case "back":
                        this.onRefSelect(fieldName);
                        break;
                    default:
                        break;
                }                
            }
        });
    }
    
    //Following havn't been used yet
    /*
    private typingTimer;
    public onKeyUp(fieldName:string, value:string):void {
        clearTimeout(this.typingTimer);
    
        this.typingTimer = setTimeout(function () {
            console.log('Input Value:', value);
        }, 1000);
    }
    */
    //**** For child component of modal UI
    public inputData;
    public outputData;
    public done:any;
    public focusEl; //ElementRef
    setFocus() {
        if (this.focusEl)
            this.focusEl.nativeElement.focus();
    }
    uiCloseModal() {
        this.outputData = null;
        this.done.emit(true);
    }
    uiOnEscapeKey() {
        this.uiCloseModal();
    }

    public selectedId = null;
    selectItemSelected(num:number) {
        let detail = this.list[num];
        this.selectedId = detail['_id'];
        this.clickedId = detail['_id'];
        this.outputData = {action: "selected", 
                            value: {"_id": detail["_id"], "value": this.stringify(detail)},
                            detail: detail
                          };
        this.done.emit(true);
    }
    
    detailSelSelected() {
        let detail = this.detail;
        this.outputData = {action: "selected", 
                            value: {"_id": detail["_id"], "value": this.stringify(detail)},
                            detail: detail
                          };
        this.done.emit(true);
    }

    selectViewDetail(num:number) {
        let detail = this.list[num];
        this.clickedId = detail['_id'];
        this.outputData = {action: "view", 
                            value: detail["_id"]
                          };
        this.done.emit(true);
    }
    
    detailSelBack() {
        this.outputData = {action: "back", 
                            value: null
                          };
        this.done.emit(true);
    }
    
    //Search more in the list view
    toggleMoreSearch() {
        this.moreSearchOpened = !this.moreSearchOpened;
    }    
    onSearchTextClear():void {
      this.searchText = undefined;
      if (!this.moreSearchOpened) this.searchList();
    }
    onSearchClear() {
        this.searchText = undefined;
        let detail = {};
        this.detail = this.formatDetail(detail);
        this.searchList();
    }
    
    /* This is for editor related */
    public textEditors:any; //type of QueryList<T>
    public textEditorMap:any = {};
    
    public extraFieldsUnload(detail: any) {//from server
        /* content has been set to directive directly so this code snippet is obsolete
        if (this.textEditors) {
            this.textEditors.forEach(editor=>{
                
                let fieldName = editor.name;
                let validatorObj = this.textEditorMap[fieldName];
                if (!validatorObj) return;
                
                let content = detail[validatorObj.fieldName]
                if (content) editor.setContent(content);
            });
        }
        */
    }

    public extraFieldsLoad() {//to server
        let result = true;
        if (this.textEditors) {
            let array = this.textEditors.toArray();
            for (let editor of array) {
                let fieldName = editor.name;
                let [content,text] = editor.getContent();
                let validatorObj = this.textEditorMap[fieldName];
                if (!validatorObj) continue;
                
                let fieldState = validatorObj.fieldState;
                fieldState.errors = {};
                if (!content) {
                    if (validatorObj.required) {
                        fieldState.errors.required = true;
                        fieldState.valid = false;
                        result = false;
                    }
                    continue;
                }
                if ('minlength' in validatorObj && text.length < validatorObj.minlength) {
                    fieldState.valid = false;
                    fieldState.errors.minlength = true;
                    result = false;
                    continue;
                }
                if ('maxlength' in validatorObj && text.length > validatorObj.maxlength) {
                    fieldState.valid = false;
                    fieldState.errors.maxlength = true;
                    result = false;
                    continue;
                }
                if ('validators' in validatorObj) {
                    let error = validatorObj['validators'].validateValue(text)
                    if (error) {
                        fieldState.valid = false;
                        fieldState.errors = error;
                        result = false;
                        continue;
                    }    
                }
                fieldState.valid = true;
                fieldState.errors = undefined;
                this.detail[validatorObj.fieldName] = content;
            }
        }
        return result;
    }
    onEdtiorPreview(editorName:string) {
        if (this.textEditors)
            this.textEditors.forEach( (editor) => {
                if (editor.name == editorName) editor.preview();
            });
    }
    
    /*Parent router related*/
    public getParentRouteItem():string {
        if (!this.route) {
            return undefined;
        }
        let routeSnapshot = this.route.snapshot;
        let parentItem;
        do {
              if (routeSnapshot.data && routeSnapshot.data.mraLevel == 1 ) {
                parentItem = routeSnapshot.data.item;
                break;
              }
              routeSnapshot = routeSnapshot.parent;
        } while (routeSnapshot)
        return parentItem;
    }

    public getParentRouteItemId():string {
        let routeSnapshot = this.route.snapshot;
        let parentItemId;
        do {
              if (routeSnapshot.data && routeSnapshot.data.mraLevel == 1 && ('id' in routeSnapshot.params)) {
                parentItemId = routeSnapshot.params.id;
                break;
              }
              routeSnapshot = routeSnapshot.parent;
        } while (routeSnapshot)
        return parentItemId;
    }
        
    public getParentRouteRefField():string {
        let mp = this.referenceFieldsMap;
        for (let prop in mp) {
            if (mp.hasOwnProperty(prop) && mp[prop] == this.parentItem) {
                return prop;
            }
        }
    }

    public getParentActivatedRouter():ActivatedRoute {
        let route = this.route;
        do {
            let data = route.snapshot.data;
            //all route inside the mra system will have mraLevel data item
            if (!data.mraLevel) return route;
            route = route.parent;
        } while (route)
        return this.route.root;
    }

    public isChildRouterActivated():boolean {
        if (!this.route) {
            return undefined;
        }
        let routeSnapshot = this.route.snapshot;


        if (routeSnapshot.firstChild) {
            return true;
        }
        return false;
    }

    public isEmptyRoutingPath():boolean {
        return this.route.snapshot.url.length === 0;
    }
    
    /*Sub detail show flag*/
    public toggleCheckedItem(i:number):void {
        this.checkedItem[i] = !this.checkedItem[i];
    }

    /*** Any View - add new component in the current view*/
    public parentData: any;
    public parentId: any;
    public isAdding: boolean = false;
    public onAdd() {
        this.isAdding = true;
    }
    public toggleAdd() {
        this.isAdding = !this.isAdding;
    }
    public isEditing: boolean = false;
    public onEdit(id:string) {
        this.isEditing = true;
        this.parentId = id;
    }

    public onActionDone(result: boolean) {
        this.isAdding = false;
        this.isEditing = false;
        if (result) { //add successful. Re-populate the current list
          if (this.view == ViewType.LIST) {
            this.populateList();
          }
        } else {
            ; //do nothing
        }
    }
    
    /*Date Range Selection */
    hoveredDate: any;

    onDateSelectionToggle(fn:string) {
        this.detail[fn]['pop'] = !this.detail[fn]['pop'];
    }
    
    onDateSelection(fn:string, date: any) {
        if (!this.detail[fn]['from'] && !this.detail[fn]['to']) {
          this.detail[fn]['from'] = date;
        } else if (this.detail[fn]['from'] && !this.detail[fn]['to'] && date.after(this.detail[fn]['from'])) {
          this.detail[fn]['to'] = date;
          this.detail[fn]['pop'] = false; //Finished. hide the selection 
        } else {
          this.detail[fn]['to'] = null;
          this.detail[fn]['from'] = date;
        }
    }

    isHovered(fn:string, date: any) {
        return this.detail[fn]['from'] && !this.detail[fn]['to'] && this.hoveredDate && date.after(this.detail[fn]['from']) && date.before(this.hoveredDate);
    }

    isInside(fn:string, date: any) {
        return date.after(this.detail[fn]['from']) && date.before(this.detail[fn]['to']);
    }

    isRange(fn:string, date: any) {
        return date.equals(this.detail[fn]['from']) || date.equals(this.detail[fn]['to']) || this.isInside(fn, date) || this.isHovered(fn, date);
    }
}
