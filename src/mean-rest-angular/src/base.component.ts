import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Injector, EventEmitter } from '@angular/core';

import { Location } from '@angular/common';

import { Observable } from 'rxjs';
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
    protected objectKeys = Object.keys;
  
    private storage:any = {};

    //For list and pagination
    protected list:any[] = [];
        
    protected majorUi = true;
    protected eventEmitter: EventEmitter<any> = new EventEmitter();
    
    protected page: number = 1;
    protected per_page: number = 25;
    protected total_count: number = 0;
    protected total_pages: number = 0;
    
    private new_page;
    
    protected pages: number[] = [];
    protected left_more:boolean = false;
    protected right_more:boolean = false;

    protected checkAll = false;
    //used to mark deleted items, or items that will show sub-detail, etc.
    protected checkedItem:boolean[] = [];
    
    //For edit and view details
    protected detail:any = {};
    private _detail:any = {}; //a clone and used to send/receive from next work
    private _extra:any = {}; //extra info.
    protected id:string;
    protected subEdit = false; //a edit-sub component
    //for fields with enum values
    protected enums:any = {};
    protected stringFields = [];
    protected referenceFields = [];
    protected referenceFieldsMap = {};
    protected dateFields = [];
    protected indexFields = [];
    protected multiSelectionFields = [];
    protected arrayFields = []; //element is [fieldName, elementType]
    protected mapFields = []; //element is [fieldName, elementType, mapKey]
    protected dateFormat = "MM/DD/YYYY";
    protected timeFormat = "hh:mm:ss";

    protected hiddenFields = []; //fields hide from view. Currrently used by "Add" view of edit-sub

    protected ItemCamelName: string;
    protected itemName: string;
    protected parentItem: string;
  
    protected refreshing: boolean = false;
  
    protected commonService: MraCommonService;

    constructor(
        protected service: BaseService,
        protected injector: Injector,
        protected router: Router,
        protected route: ActivatedRoute,
        protected location: Location,
        protected view: ViewType,
        protected itemCamelName: string) {
      
        this.ItemCamelName = itemCamelName.charAt(0).toUpperCase() + itemCamelName.substr(1);
        this.itemName = itemCamelName.toLowerCase();
        this.parentItem = this.getParentRouteItem();
        this.commonService = injector.get(MraCommonService);
        
    }
    
    protected onServiceError(error:ServiceError):void {
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
    }

    protected populatePages():void {        
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
    
    protected onNextPage():void {
        if (this.page >= this.total_pages) return;
        this.routeToPage(this.page + 1);
    }
    
    protected onPreviousPage():void {
        if (this.page <= 1) return;
        this.routeToPage(this.page - 1);
    }

    protected onGotoPage(p:number):void {
        if (p > this.total_pages || p < 1) return;
        this.routeToPage(p)
    }
    
    protected goBack() {
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
    
    protected stringify(detail:any): string {
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
  
    /***Start: handle reference fields***/
    protected formatReferenceField(field: any, fieldName: string ):any {
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
    protected formatReference(detail:any ):any {
        for (let fnm of this.referenceFields) {
            detail[fnm] = this.formatReferenceField(detail[fnm], fnm);
        }
        return detail;
    }
    protected deFormatReference(detail:any ):any {
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
    
    protected clearFieldReference(field:any ):any {
        for (let prop in field) {
            field[prop] = undefined;
        }
        return field;
    }

    protected isDefinedFieldReference(field:any ):any {
        if ('_id' in field && typeof field['_id'] == 'string') return true;
        return false;
    }
    /***Start: handle date fields***/    
    protected formatDateField(field:string):any {
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
    
    protected formatDate(detail:any ):any {
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
    
    protected deFormatDateField(date:any):string {
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
    
    protected deFormatDate(detail:any ):any {
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
    protected clearFieldDate(field:any ):any {
        for (let prop in field) {
            field[prop] = undefined;
        }
        return field;
    }
    protected isDefinedFieldDate(field:any ):any {
        if (typeof field === 'object') {
                if (typeof field['date'] == 'object') return true;
                if (typeof field['from'] == 'object') return true;
                if (typeof field['to'] == 'object') return true;
        }
        return false;
    }

    /***Start: handle array of multi-selection fields***/
    protected formatArrayMultiSelectionField(field: any, enums: any): any {
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
    protected formatArrayMultiSelection(detail:any ):any {
        for (let fnm of this.multiSelectionFields) {
            detail[fnm] = this.formatArrayMultiSelectionField(detail[fnm], this.enums[fnm]);
        }
        return detail;
    }
    
    protected deFormatArrayMultiSelection(detail:any ):any {
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
    protected clearFieldArrayMultiSelection(field:any ):any {
        if (!field['selection']) return field;
        for (let prop in field['selection']) {
            field['selection'][prop] = false; //not exist
        }
        return field;
    }

    protected isDefinedFieldArrayMultiSelection(field:any ):any {
        if ('selection' in field && typeof field['selection'] == 'object') {
            let keys = Object.keys(field['selection']);
            return keys.some(e=>{return field['selection'][e]});
        }
        return false;
    }
    protected multiselectionSelected(fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldArrayMultiSelection(this.detail[fieldName]);
    }
    /***End: handle array of multi-selection fields***/
    /***Start: handle map fields***/
    protected formatMapField(field: any, elementType: string): any {
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
    protected formatMapFields(detail:any ):any {
        for (let f of this.mapFields) {
            //[fieldName, elementType]
            detail[f[0]] = this.formatMapField(detail[f[0]], f[1]);
        }
        return detail;
    }

    protected deFormatMapFields(detail:any ):any {
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

    protected clearFieldMap(field:any ):any {
        if (!field['selection']) return field;
        field['selection'] = {};
        field.value = undefined;
        return field;
    }

    protected isDefinedFieldMap(field:any ):any {
        if ('selection' in field && typeof field['selection'] == 'object') {
            return Object.keys(field['selection']).length > 0;
        }
        return false;
    }
    protected mapSelected(fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldMap(this.detail[fieldName]);
    }
    /***End: handle map fields***/
    /***Start: handle array fields***/
    protected formatArrayField(field: any, elementType: string): any {
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
    protected formatArrayFields(detail:any ):any {
        for (let f of this.arrayFields) {
            //[fieldName, elementType]
            detail[f[0]] = this.formatArrayField(detail[f[0]], f[1]);
        }
        return detail;
    }

    protected deFormatArrayFields(detail:any ):any {
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

    protected clearFieldArray(field:any ):any {
        if (!field['selection']) return field;
        field['selection'] = [];
        field.value = undefined;
        return field;
    }

    protected isDefinedFieldArray(field:any ):any {
        if ('selection' in field && Array.isArray(field['selection'])) {
            return field['selection'].length > 0;
        }
        return false;
    }
    protected arraySelected(fieldName) {
        if (!this.detail[fieldName] || !Array.isArray(this.detail[fieldName]['selection'])) {
            return false;
        }
        return this.isDefinedFieldArray(this.detail[fieldName]);
    }
    /***End: handle array fields***/
  
    protected formatDetail(detail:any ):any {
        detail = this.formatReference(detail);
        detail = this.formatDate(detail);
        detail = this.formatArrayMultiSelection(detail);
        detail = this.formatArrayFields(detail);
        detail = this.formatMapFields(detail);
        return detail;
    }    
    
    protected deFormatDetail(detail:any ):any {
        let cpy = Util.clone(detail);
        
        cpy = this.deFormatReference(cpy);
        cpy = this.deFormatDate(cpy);
        cpy = this.deFormatArrayMultiSelection(cpy);
        cpy = this.deFormatArrayFields(cpy);
        cpy = this.deFormatMapFields(cpy);
        return cpy;
    }
    
    protected populateDetail(id: string):EventEmitter<any> {
      return this.populateDetailForAction(id, null);
    }

    protected populateDetailForAction(id: string, action: string):EventEmitter<any> {
      //action: eg: action=edit  -> get detail for editing purpose 
      this.service.getDetailForAction(id, action).subscribe(
        detail => {
            let originalDetail = Util.clone(detail);
            if (detail["_id"]) this.commonService.putToStorage(detail["_id"], originalDetail);//cache it
            
            this.detail = this.formatDetail(detail);
            this.extraFieldsUnload();//unload data to text editors, etc
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
            this.eventEmitter.emit(this.detail);
        },
        this.onServiceError
      );
      return this.eventEmitter;
    }
    

    protected populateDetailFromCopy(copy_id:string):void {
      this.service.getDetail(copy_id).subscribe(
        detail => {            
            this.detail = this.formatDetail(detail);
            delete this.detail["_id"];
            this.extraFieldsUnload();//unload data to text editors, etc
            this.extraInfoPopulate();//collect other info required for create view
        },
        this.onServiceError
      );
    }

    protected extraInfoPopulate() {
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

    protected processSearchContext() {
        this.moreSearchOpened = false;
        let d = this.detail;
        for (let s of this.stringFields) {
            d[s] = this.searchText;
        }
        let orSearchContext = [], andSearchContext = [];
        for (let field in d) {
            if (typeof d[field] == 'string') {
                let o = {}
                o[field] = d[field];
                orSearchContext.push(o);
            }
        }
        
        this.searchMoreDetail = []
        let d2 = this.deFormatDetail(d);//undefined field is deleted after this step
        for (let field in d2) {
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

                this.searchMoreDetail.push([field, valueToShow]);
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
    protected searchList():void {
        this.processSearchContext();
        //update the URL
        this.router.navigate(['.', {}], {relativeTo: this.route});//start from 1st page
        this.putToStorage("page", 1);//start from 1st page
        this.populateList();
    }
    protected loadUIFromCache():void {
        //Now let's reload the search condition to UI
        this.searchText = this.getFromStorage("searchText");
        this.searchMoreDetail = this.getFromStorage("searchMoreDetail");
        let detail = this.getFromStorage("detail");
        if (detail) this.detail = detail;
    }
    
    protected populateList():EventEmitter<any> {
        //First let's handle page
        let new_page;
        let searchContext, searchText;

        let url_page = parseInt(this.route.snapshot.paramMap.get('page'));
        let cached_page = parseInt(this.getFromStorage("page"));
            
        if (cached_page) { 
            new_page = cached_page;
            if (cached_page == 1)
                this.router.navigate(['.', {}], {relativeTo: this.route, });//update the url
            else
                this.router.navigate(['.', {page: cached_page}], {relativeTo: this.route, });//update the url
        }
        else if (url_page) new_page = url_page;
        else new_page = 1;

        searchContext = this.getFromStorage("searchContext");
        this.loadUIFromCache();      

        this.service.getList(new_page, this.per_page, searchContext).subscribe(
          result => { 
            this.list = result.items.map(x=>this.formatDetail(x));
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
            this.eventEmitter.emit(this.list);
          },
          this.onServiceError
        );
      return this.eventEmitter;
    }
    
    
    /*UI operations handlers*/
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
    
    public onCheckAllChange():void {
        this.checkedItem = 
             Array.apply(null, Array(this.list.length)).
                map(Boolean.prototype.valueOf,this.checkAll);
    }
    
    public isItemSelected():boolean {
        return this.checkedItem.some((value)=>{return value;})
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
                
                this.router.navigate(['../../detail', this.id], {relativeTo: this.route});
            },
            this.onServiceError
          );
      }
      else {
          this.service.createOne(this._detail).subscribe(
            result => {
                let action = this.subEdit? " added":" created.";

                var snackBarConfig: SnackBarConfig = {
                    content: this.ItemCamelName + action
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                this.id = result["_id"];
                this._detail = result;

                if (this.subEdit) {
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
        if (this.subEdit) {
            this.done.emit(false);
        } else {
            this.goBack();
        } 
    }

    protected clickedId = null;
    public onDisplayRefClicked(fn:string, detail:any, event:any):void {
        let ref = this.getRefFromField(fn);
        let d = detail;
        
        if (d && d['_id']) {
            if (this.list) {
                for (let item of this.list){
                    if (item[fn] == d) this.clickedId = item['_id'];
                }
            }
            this.router.navigate([ref, 'detail', d['_id']], {relativeTo: this.getParentActivatedRouter() });
        }
        if (event) event.stopPropagation();
    }

    public onDetailLinkClicked(id:string):void {
        this.clickedId = id; 
        this.router.navigate([this.itemName, 'detail', id], {relativeTo: this.getParentActivatedRouter() });
    }
    
    protected getRefFromField(fn:string):string {
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
    protected refSelectDirective:any;
    protected selectComponents:any; //{fieldName: component-type} format
    protected componentFactoryResolver: any; //injected by extended class, if needed.
    private componentSubscription
    public onRefSelect(fieldName:string) {
        let viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        
        let componentRef = this.selectComponents[fieldName]["componentRef"];
        if (!componentRef) {
            let comType = this.selectComponents[fieldName]["select-type"]
            if (!comType) console.error("No component type found for: %s", "select-type");

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
    protected focusEl; //ElementRef
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

    protected selectedId = null;
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
    protected searchText: string;
    protected searchMoreDetail: any;
    public moreSearchOpened:boolean = false;
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
    protected textEditors:any; //type of QueryList<T>
    protected textEditorMap:any = {};
    
    protected extraFieldsUnload() {//from server
        if (this.textEditors) {
            this.textEditors.forEach(editor=>{
                
                let fieldName = editor.name;
                let validatorObj = this.textEditorMap[fieldName];
                if (!validatorObj) return;
                
                let content = this.detail[validatorObj.fieldName]
                if (content) editor.setContent(content);
            });
        }
    }
        
    protected extraFieldsLoad() {//to server
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
    protected getParentRouteItem():string {
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

    protected getParentRouteItemId():string {
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
        
    protected getParentRouteRefField():string {
        let mp = this.referenceFieldsMap;
        for (let prop in mp) {
            if (mp.hasOwnProperty(prop) && mp[prop] == this.parentItem) {
                return prop;
            }
        }
    }

    protected getParentActivatedRouter():ActivatedRoute {
        let route = this.route;
        do {
            let data = route.snapshot.data;
            //all route inside the mra system will have mraLevel data item
            if (!data.mraLevel) return route;
            route = route.parent;
        } while (route)
        return this.route.root;
    }
    
    /*Sub detail show flag*/
    public toggleCheckedItem(i:number):void {
        this.checkedItem[i] = !this.checkedItem[i];
    }

    /*** Any View - add new component in the current view*/
    protected isAdding: boolean = false;
    public onAdd() {
        this.isAdding = true;
    }
    public toggleAdd() {
        this.isAdding = !this.isAdding;
    }
    public onAddDone(result: boolean) {
        this.isAdding = false;
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
