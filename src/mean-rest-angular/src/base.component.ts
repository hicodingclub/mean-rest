import { Router, ActivatedRoute, ParamMap }    from '@angular/router';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ModalConfig, Modal} from './util.modal';
import { SnackBarConfig, SnackBar} from './util.snackbar';
import { ErrorToastConfig, ErrorToast} from './util.errortoast';

import { BaseService, ServiceError } from './base.service';

export enum ViewType {
    LIST,
    DETAIL,
    EDIT,
}

export {ServiceError};

export class BaseComponent {
    //For list and pagination
    protected list:any[];
    
    protected page: number = 1;
    protected per_page: number = 25;
    protected total_count: number = 0;
    protected total_pages: number = 0;
    
    protected pages: number[] = [];
    protected left_more:boolean = false;
    protected right_more:boolean = false;

    protected checkAll = false;
    protected checkedItem:boolean[] = [];
    
    //For edit and view details
    protected detail:any;
    protected id:string;

    protected capitalItemName: string;

    constructor(
        protected service: BaseService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected view: ViewType,
        protected itemName: string) {
        this.capitalItemName = itemName.charAt(0).toUpperCase() + itemName.substr(1);
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
    
    protected onNextPage():void {
        if (this.page >= this.total_pages) return;
        this.service.putToStorage("page", this.page + 1);
        this.router.navigate(['.', { page: this.page + 1 }], {relativeTo: this.route, });
    }
    
    protected onPreviousPage():void {
        if (this.page <= 1) return;
        this.service.putToStorage("page", this.page - 1);
        this.router.navigate(['.', { page: this.page - 1 }], {relativeTo: this.route});
    }

    protected onGotoPage(p:number):void {
        if (p > this.total_pages || p < 1) return;
        this.service.putToStorage("page", p);
        this.router.navigate(['.', { page: p }], {relativeTo: this.route});
    }
    
    protected populateDetail(id:string):void {
      this.service.getDetail(this.id).subscribe(
        detail => { 
            this.detail = detail;
        },
        this.onServiceError
      );
    }
        
    protected populateList():void {
      let url_page = parseInt(this.route.snapshot.paramMap.get('page'));
      let cached_page = parseInt(this.service.getFromStorage('page'));
      if (!url_page && cached_page && cached_page > 1) {
          this.router.navigate(['.', { page: cached_page }], {relativeTo: this.route});
          return;
      }
      let new_page = url_page? url_page: 1;
        
      this.service.getList(new_page, this.per_page).subscribe(
        result => { 
            this.list = result.items;
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
                            content: this.capitalItemName + " deleted"
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
                            content: this.capitalItemName + " deleted"
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
      if (this.id) {
          this.service.updateOne(this.id, this.detail).subscribe(
            result => {
                var snackBarConfig: SnackBarConfig = {
                    content: this.capitalItemName + " updated."
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                this.router.navigate(['../../detail', this.id], {relativeTo: this.route});
            },
            this.onServiceError
          );
      }
      else {
          this.service.createOne(this.detail).subscribe(
            result => {
                var snackBarConfig: SnackBarConfig = {
                    content: this.capitalItemName + " created."
                }
                var snackBar = new SnackBar(snackBarConfig);
                snackBar.show();
                
                this.id = result["_id"];
                this.detail = result;
                
                this.router.navigate(['../detail', this.id], {relativeTo: this.route});
            },
            this.onServiceError
          );
      }
    }
    
    public clearValueFromDetail(field:string):void {
        if (this.detail && this.detail.hasOwnProperty(field)) delete this.detail[field];
    }
}
