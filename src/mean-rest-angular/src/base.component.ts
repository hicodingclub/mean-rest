import { Router, ActivatedRoute, ParamMap }    from '@angular/router';
import { Location } from '@angular/common';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ModalConfig, Modal} from './util.modal';
import { SnackBarConfig, SnackBar} from './util.snackbar';
import { ErrorToastConfig, ErrorToast} from './util.errortoast';

import { BaseService, ServiceError } from './base.service';
import { MraCommonService } from './common.service';
import { BaseComponentInterface } from './base.interface';

function equalTwoSearchContextArrays (arr1, arr2) {
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

function clone(obj:any):any {
    let copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

export enum ViewType {
    LIST,
    DETAIL,
    EDIT,
}

export {ServiceError};

export class BaseComponent implements BaseComponentInterface {
    private storage:any = {};

    //For list and pagination
    protected list:any[] = [];
    protected currentNumInList;
    
    protected majorUi = true;
    
    protected page: number = 1;
    protected per_page: number = 25;
    protected total_count: number = 0;
    protected total_pages: number = 0;
    
    private new_page;
    
    protected pages: number[] = [];
    protected left_more:boolean = false;
    protected right_more:boolean = false;

    protected checkAll = false;
    protected checkedItem:boolean[] = [];
    
    //For edit and view details
    protected detail:any = {};
    private _detail:any = {}; //a clone and used to send/receive from next work
    protected id:string;
    //for fields with enum values
    protected enums:any = {};
    protected stringFields = [];
    protected referenceFields = [];
    protected referenceFieldsMap = {};
    protected dateFields = [];
    protected indexFields = [];
    protected dateFormat = "MM/DD/YYYY";

    protected ItemName: string;
    //protected itemName: string; //defined in constuctor
    protected parentItem: string;

    constructor(
        protected service: BaseService,
        protected commonService: MraCommonService,      
        protected router: Router,
        protected route: ActivatedRoute,
        protected location: Location,
        protected view: ViewType,
        protected itemName: string) {
        this.ItemName = itemName.charAt(0).toUpperCase() + itemName.substr(1);
        this.parentItem = this.getParentRouteItem();
        
    }
    
    protected onServiceError(error:ServiceError):void {
        let errMsg:string;
        let more:string;
        if (error.clientErrorMsg) {
            errMsg = error.clientErrorMsg;
        }
        else if (error.serverError) {
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
        if (this.majorUi) {
            this.router.navigate(['.', { page: page }], {relativeTo: this.route, });
        } else if (page != this.page) {
            this.populateList();
        }
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
        // window.history.back();
        this.location.back();
    }
    
    protected stringify(detail:any):string {
        let str = "";
        for (let fnm of this.indexFields) {
            if (detail[fnm] && typeof detail[fnm] != 'object') str += " " + detail[fnm]
        }
        if (!str) str = detail["_id"]?detail["_id"]:"..."
        str = str.replace(/^\s+|\s+$/g, '')
        return str;
    }

    protected formatReference(detail:any ):any {
        let id, value;
        for (let fnm of this.referenceFields) {
            if (typeof detail[fnm] == 'string') {
                //assume this is the "_id", let see we have the cached details for this ref from service
                let refDetail = this.commonService.getFromStorage(detail[fnm]);
                if (refDetail && (typeof refDetail == 'object')) detail[fnm] = refDetail;
                else {
                    id = detail[fnm];
                    detail[fnm] = {'_id': id};
                }
            }
            if (detail[fnm] && (typeof detail[fnm] == 'object') ) {
                id = detail[fnm]['_id'];
                let referIndex = '';
                for (let k in  detail[fnm]) {
                    if (k != '_id') referIndex += " " + detail[fnm][k];
                }
                referIndex = referIndex.replace(/^\s+|\s+$/g, '');
                if (referIndex.length >= 20) referIndex = referIndex.substring(0, 20) + "...";
                detail[fnm] = {'_id': id, 'value': referIndex? referIndex: fnm};
            } else {//not defined
                detail[fnm] = {'_id': id, 'value': value};
            }
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
    protected formatDateField(field:string):any {
            let fmt = this.dateFormat;
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
                               replace(/dd/ig, dd.toString()).
                               replace(/hh/ig, hh.toString()).
                               replace(/mm/g, mm.toString()).
                               replace(/ss/ig, ss.toString());
                /*Datepicker uses NgbDateStruct as a model and not the native Date object. 
                It's a simple data structure with 3 fields. Also note that months start with 1 (as in ISO 8601).
                
                we add h, m, s here
                */
                return {'date':{ day: d, month: M, year: yyyy}, 'value': value}

    }
    protected formatDate(detail:any ):any {
        for (let fnm of this.dateFields) {
            let value, date;
            if (typeof detail[fnm] !== 'string') { //not defined
                //important: let date values undefined
                detail[fnm] = {'date':date, 'value': value};
            }
            else {
                detail[fnm] = this.formatDateField(detail[fnm]);
            }
        }
        return detail;
    }
    protected deFormatDate(detail:any ):any {
        for (let fnm of this.dateFields) {
            let d, M, yyyy, h, m, s;
            let value;
            if (typeof detail[fnm] !== 'object') { //not defined
                //let date values undefined
                delete detail[fnm];
            }
            else {
                if (! detail[fnm].date) delete detail[fnm];
                else {
                    yyyy = detail[fnm].date.year;
                    M = detail[fnm].date.month - 1;
                    d = detail[fnm].date.day;
                    
                    if (typeof yyyy !== 'number' || typeof M !== 'number' || typeof d !== 'number') delete detail[fnm];
                    
                    else {
                        let dt = new Date(yyyy, M, d, 0, 0, 0, 0);
                        detail[fnm] = dt.toISOString();
                    }
                }
            }
        }
        return detail;
    }
    protected formatDetail(detail:any ):any {
        detail = this.formatReference(detail);
        detail = this.formatDate(detail);
        return detail;
    }    
    
    protected deFormatDetail(detail:any ):any {
        let cpy = clone(detail);
        
        cpy = this.deFormatReference(cpy);
        cpy = this.deFormatDate(cpy);
        return cpy;
    }
    
    protected populateDetail(id:string):void {
      this.service.getDetail(this.id).subscribe(
        detail => {
            let originalDetail = clone(detail);
            if (detail["_id"]) this.commonService.putToStorage(detail["_id"], originalDetail);//cache it
            
            this.detail = this.formatDetail(detail);
            this.extraFieldsUnload();//unload data to text editors, etc
        },
        this.onServiceError
      );
    }
    protected processSearchContext() {
        this.moreSearchOpened = false;
        let d = this.detail;
        for (let s of this.stringFields) {
            d[s] = this.searchText;
        }
        let orSearchContext = [], andSearchContext = [];
        for (let prop in d) {
            if (typeof d[prop] == 'string') {
                let o = {}
                o[prop] = d[prop];
                orSearchContext.push(o);
            }
        }
        
        this.searchMoreDetail = []
        let d2 = this.deFormatDetail(d);
        for (let prop in d2) {
            if (this.stringFields.indexOf(prop) == -1) {
                let o = {}
                o[prop] = d2[prop];
                andSearchContext.push(o);
                
                let valueToShow;
                if(typeof d[prop] != 'object') valueToShow = d[prop];
                else if (d[prop]['date']) { //Date fields
                    let dt = this.formatDateField(d2[prop])
                    valueToShow = dt.value;
                } else if (d[prop]['_id']) { //Refer Object
                    valueToShow = d[prop]['value'];
                }
                this.searchMoreDetail.push(prop + ": " + valueToShow);
            }
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
            if (equalTwoSearchContextArrays(cachedOr, orSearchContext) 
                && equalTwoSearchContextArrays(cachedAnd, andSearchContext)) {
                return;
            }
        } 
                
        this.putToStorage("searchContext", searchContext);
        this.putToStorage("searchText", this.searchText);
        this.putToStorage("page", null);//start from 1st page
        this.putToStorage("searchMoreDetail", this.searchMoreDetail);
        this.putToStorage("detail", this.detail);
    }
    protected searchList():void {
        this.processSearchContext();
        if (this.majorUi) {
            //update the URL
            let url_page = parseInt(this.route.snapshot.paramMap.get('page'));
            if (url_page) this.router.navigate(['.', {}], {relativeTo: this.route});//start from 1st page
            //re-populate directly
            else this.populateList();
        } else {
            //re-populate directly
            this.populateList();
        }
    }
    protected loadUIFromCache():void {
        //Now let's reload the search condition to UI
        this.searchText = this.getFromStorage("searchText");
        this.searchMoreDetail = this.getFromStorage("searchMoreDetail");
        let detail = this.getFromStorage("detail");
        if (detail) this.detail = detail;
    }
    
    protected populateList():void {
        /*
        let queryParamMap = this.route.snapshot.queryParamMap;
        
        //first let check if there are other search parameters in the url other than page
        let paramKeys:string[] = queryParamMap.keys;
        if (paramKeys.length > 0) {//reconstruct the detail, which has the search context
            let d = {};
            for (let k of paramKeys) d[k] = queryParamMap.get(k);
            this.detail = this.formatDetail(d);
            this.processSearchContext();//reset search to what is provided here            
        }
        */
        
        //now let's handle page
        let new_page;
        let searchContext, searchText;
        if (this.majorUi) {
          let url_page = parseInt(this.route.snapshot.paramMap.get('page'));
          let cached_page = parseInt(this.getFromStorage("page"));
          if (!url_page && cached_page && cached_page > 1) {
              //reflect page on the url
              this.router.navigate(['.', { page: cached_page }], {relativeTo: this.route});
              return;
          }
          new_page = url_page? url_page: 1;
        }
        else {
          new_page = this.getFromStorage("page");
          if (!new_page) new_page = 1;
        }
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
          },
          this.onServiceError
        );
    }
    
    
    /*UI operations hanlers*/
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
                            content: this.ItemName + " deleted"
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
        content: "Are you sure you want to delete this " + this.itemName + " from the system?",
        //list of button text
        buttons: ['Delete', 'Cancel'],
        //list of button returns when clicked
        returns: [true, false],
        callBack: (result) => {
            if (result) {
                this.service.deleteOne(id).subscribe(
                    result => {
                        let snackBarConfig: SnackBarConfig = {
                            content: this.ItemName + " deleted"
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
                    content: this.ItemName + " updated."
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
                var snackBarConfig: SnackBarConfig = {
                    content: this.ItemName + " created."
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                this.id = result["_id"];
                this._detail = result;
                
                this.router.navigate(['../detail', this.id], {relativeTo: this.route});
            },
            this.onServiceError
          );
      }
    }
    
    public onDisplayRefClicked(fn:string, detail:any):void {
        let ref = this.getRefFromField(fn);
        let d = detail;
        
        if (d && d['_id']) this.router.navigate([ref, 'detail', d['_id']], {relativeTo: this.getParentActivatedRouter() });
    }
    
    protected getRefFromField(fn:string):string {
        return this.referenceFieldsMap[fn];
    }

    public clearValueFromDetail(field:string):void {
        if (!this.detail.hasOwnProperty(field)) return;
        if (typeof this.detail[field] == 'undefined') return;
        if (typeof this.detail[field] == 'object') {//reference field or date
            for (let prop in this.detail[field]) {
                this.detail[field][prop] = undefined;
            }
        } else {
            delete this.detail[field];
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
            if ('date' in d[field] && typeof d[field]['date'] == 'object') return true;
            if ('_id' in d[field] && typeof d[field]['_id'] == 'string') return true;
        }
        return false;
    }
    
    //**** For parent component of modal UI
    protected refSelectDirective:any;
    protected selectComponents:any; //{fieldName: component-type} format
    protected componentFactoryResolver:any;
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
                        this.detail[fieldName] = outputData.value;
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
        let viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        
        let detailType = action + "-detail-type"; //eg: select-detail-type, pop-detail-type
        let comType = this.selectComponents[fieldName][detailType]
        if (!comType) console.error("No component type found for: %s", detailType);
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
                        this.detail[fieldName] = outputData.value;
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

    selectItemSelected(num:number) {
        this.currentNumInList = num;
        let detail = this.list[num];
        this.outputData = {action: "selected", 
                            value: {"_id": detail["_id"], "value": this.stringify(detail)}
                          };
        this.done.emit(true);
    }
    
    detailSelSelected() {
        let detail = this.detail;
        this.outputData = {action: "selected", 
                            value: {"_id": detail["_id"], "value": this.stringify(detail)}
                          };
        this.done.emit(true);
    }

    selectViewDetail(num:number) {
        this.currentNumInList = num;
        let detail = this.list[num];
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
    
    
}
