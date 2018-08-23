import { Router, ActivatedRoute, ParamMap }    from '@angular/router';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ModalConfig, Modal} from './util.modal';
import { SnackBarConfig, SnackBar} from './util.snackbar';
import { ErrorToastConfig, ErrorToast} from './util.errortoast';

import { BaseService, ServiceError } from './base.service';
import { BaseComponentInterface } from './base.interface';


function equalTwoSearchContextArrays (arr1, arr2) {
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
    protected referenceFields = [];
    protected dateFields = [];
    protected indexFields = [];
    protected dateFormat = "MM/DD/YYYY";
    //Search
    protected searchText: string;    

    protected ItemName: string;

    constructor(
        protected service: BaseService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected view: ViewType,
        protected itemName: string) {
        this.ItemName = itemName.charAt(0).toUpperCase() + itemName.substr(1);
        localStorage.removeItem("ngbDateformate");
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
        return this.itemName+this.view+key;
    }
    private putToStorage(key:string, value:any):void {
        if (this.majorUi) {
            this.service.putToStorage(this.getKey(key), value);
        } else {
            this.storage[key] = value;
        }
    }
    private getFromStorage(key:string):any {
        if (this.majorUi) {
            return this.service.getFromStorage(this.getKey(key));
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
                id = detail[fnm];
                detail[fnm] = {'_id': id, 'value': fnm};
            } else if (typeof detail[fnm] == 'object') {
                id = detail[fnm]['_id'];
                let referIndex = '';
                for (let k in  detail[fnm]) {
                    if (k != '_id') referIndex += " " + detail[fnm][k];
                }
                referIndex = referIndex.replace(/^\s+|\s+$/g, '')
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
    protected formatDate(detail:any ):any {
        for (let fnm of this.dateFields) {
            let fmt = this.dateFormat;
            let d, M, yyyy, h, m, s;
            let value, date;
            if (typeof detail[fnm] !== 'string') { //not defined
                //important: let date values undefined
                detail[fnm] = {'date':date, 'value': value};
            }
            else {
                let dt = new Date(detail[fnm]);
                
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
                
                value = fmt.replace(/yyyy/ig, yyyy.toString()).
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
                detail[fnm] = {'date':{ day: d, month: M, year: yyyy}, 'value': value}
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
            this.detail = this.formatDetail(detail);
        },
        this.onServiceError
      );
    }
    
    protected searchAdd(operation:string, fieldQueryList:any[]):void {
        /* searchContext ={'$and', [{'$or', []},{'$and', []}]}
        */
        let context = this.getFromStorage("searchContext");
        let arr;
        let newQuery = {};
        newQuery[operation] = fieldQueryList;
        if (context && context["$and"]) {
            arr = context["$and"].filter(x=>(operation in x));
            if (arr.length == 1 && equalTwoSearchContextArrays(arr[0][operation], fieldQueryList)) return; //no change
            
            arr = context["$and"].filter(x=>!(operation in x));
            arr.push(newQuery);
            context["$and"] = arr;
        } else {
            if (fieldQueryList.length == 0) return; //no change
            context = {"$and": [newQuery]};
        }
                
        this.putToStorage("searchContext", context);
        this.putToStorage("searchText", this.searchText);
        this.putToStorage("page", null);//start from 1st page

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
    
    protected populateList():void {
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

        this.service.getList(new_page, this.per_page, searchContext).subscribe(
          result => { 
            this.list = result.items.map(x=>this.formatDetail(x));
            this.page = result.page;
            this.per_page = result.per_page;
            this.total_count = result.total_count;
            this.total_pages = result.total_pages;
            this.populatePages();
            
            this.searchText = this.getFromStorage("searchText");

            this.checkedItem = 
                Array.apply(null, Array(this.list.length)).map(Boolean.prototype.valueOf,false);
            this.checkAll = false;
          },
          this.onServiceError
        );
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
    
    public clearValueFromDetail(field:string):void {
        if (!this.detail || !this.detail.hasOwnProperty(field)) return;
        if (typeof this.detail[field] == 'object') {//reference field
            for (let prop in this.detail[field]) {
                this.detail[field][prop] = undefined;
            }
        } else {
            delete this.detail[field];
        }
    }
    
    
    //**** For parent component of modal UI
    protected refSelectDirective:any;
    protected selectComponents:any;
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
    uiCloseModal() {
        this.outputData = null;
        this.done.emit(true);
    }
    uiOnEscapeKey() {
        this.uiCloseModal();
    }

    selectItemSelected(num:number) {
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
}
