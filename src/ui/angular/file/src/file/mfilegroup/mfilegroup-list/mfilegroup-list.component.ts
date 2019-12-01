import { Component, OnInit, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Injector } from '@angular/core';

import { MfilegroupComponent, ViewType } from '../mfilegroup.component';
import { MfilegroupService } from '../mfilegroup.service';



  
@Component({
  selector: 'app-mfilegroup-list',
  templateUrl: './mfilegroup-list.component.html',
  styleUrls: ['./mfilegroup-list.component.css']
})
export class MfilegroupListComponent extends MfilegroupComponent implements OnInit {

  public minDate = {year: (new Date()).getFullYear() - 100, month: 1, day: 1};

  @Input()
  public inputData:any;
  @Input()
  public searchObj:any;
  @Input()
  public categoryBy:string; //field name whose value is used as category
  

  constructor(

      public mfilegroupService: MfilegroupService,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
          super(
                mfilegroupService, injector, router, route, location, ViewType.LIST);


          this.stringFields.push('name');









          this.listViewFilter = 'list';

          const listCategories = [];
          this.listCategory1 = listCategories[0] || {};
          this.listCategory2 = listCategories[1] || {};
  }

  ngOnInit() {
      this.adjustListViewForWindowSize();

      // this is to initialize the detail that will be used for search condition selection
      const detail = this.searchObj || {};
      this.detail = this.formatDetail(detail);
      this.populateList();
  }

  static getInstance() {
    //used by others to call some common functions
    return new MfilegroupListComponent(null, null, null, null, null);
  }
}

