import {
  Component,
  OnInit,
  Input
} from '@angular/core';
import {
  Location
} from '@angular/common';
import {
  Router,
  ActivatedRoute
} from '@angular/router';
import {
  Injector
} from '@angular/core';
import {
  MfilegroupListCustComponent
} from '../../../file-cust/base/mfilegroup/mfilegroup-list.cust.component';
import {
  ViewType
} from '../mfilegroup.component';
import {
  MfilegroupService
} from '../mfilegroup.service';
@Component({
  template: '',
})
export class MfilegroupListComponent extends MfilegroupListCustComponent implements OnInit {
  public listViewProperties: any = {
    index: {
      mobile: true
    }
  };
  // used by association widget for the associated schema
  public assoCompInstance: any;
  public assoCompFields: any = [];
  public assoCompObjects: any = [];
  public clickItemAction: string = '';
  public cardHasLink: boolean = false;
  public cardHasSelect: boolean = false;
  public includeSubDetail: boolean = false;
  public canUpdate: boolean = true;
  public canDelete: boolean = false;
  public canArchive: boolean = false;
  public canCheck: boolean = false;
  public itemMultiSelect: boolean = true;
  public majorUi: boolean = false;
  // Do query on NgInit in this base class
  public queryOnNgInit: boolean = true;
  // @Input() options: any; {disableCatetory: false, disablePagination: false, disbleActionButtons: false
  //                        disableListSearch: false, disableTitle: false, disableRefs: false
  //                        disableListHead: false, disableTitleRow: false}
  // @Input()
  // public inputData:any;
  // @Input()
  // public searchObj:any;
  // @Input()
  // public queryParams: any;  // {listSortField: 'a', listSortOrder: 'asc' / 'desc', perPage: 6}
  // @Input()
  // public categoryBy:string; //field name whose value is used as category
  constructor(public mfilegroupService: MfilegroupService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(mfilegroupService, injector, router, route, location);
    this.view = ViewType.LIST;
    this.fieldDisplayNames = {
      'name': 'Name',
    };
    this.stringFields.push('name');
    const listCategories = [];
    this.listCategory1 = listCategories[0] || {};
    this.listCategory2 = listCategories[1] || {};
  }
  ngOnInit() {
    super.ngOnInit();
    this.adjustListViewForWindowSize();
    if (!this.options) {
      this.options = {};
    }
    const properties = ['clickItemAction', 'cardHasLink', 'cardHasSelect', 'includeSubDetail', 'canUpdate', 'canDelete', 'canArchive', 'canCheck', 'itemMultiSelect', 'majorUi', ];
    this.applyProperties(this.options, this, properties);
    if (this.options.disableCatetory) {
      this.listCategory1 = {}; // no do query based on category for home view;
      this.listCategory2 = {}; // no do query based on category for home view;
    }
    this.listViewFilter = this.options.listViewFilter || this.listViewFilter
    // this is to initialize the detail that will be used for search condition selection
    let detail = {};
    if (this.searchObj) {
      this.searchDetailReady = true; // search provided from "detail", not from search bar.
      detail = this.searchObj;
    }
    if (this.queryParams) {
      this.listSortField = this.queryParams.listSortField;
      this.listSortOrder = this.queryParams.listSortOrder;
      if (this.queryParams.perPage) {
        this.perPage = this.queryParams.perPage
      }
    }
    this.detail = this.formatDetail(detail);
    if (this.queryOnNgInit) {
      this.searchList();
      // get editHintFields
      this.searchHintFieldValues();
    }
  }
  viewUIEvent(evt: any) {
    const thisObject = this;
    thisObject[evt.type].apply(this, evt.params);
  }
  static getInstance() {
    //used by others to call some common functions
    return new MfilegroupListComponent(null, null, null, null, null);
  }
}