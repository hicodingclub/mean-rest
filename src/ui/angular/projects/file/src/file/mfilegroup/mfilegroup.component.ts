import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MddsBaseComponent, ViewType } from '@hicoder/angular-core';
import { Injector, Component } from '@angular/core';
import { MfilegroupService } from './mfilegroup.service';

const itemCamelName = 'picture Group';

export { ViewType };

import { ViewChild } from '@angular/core';

import { ElementRef } from '@angular/core';


@Component({
  template: '',
})
export class MfilegroupComponent extends MddsBaseComponent {


    @ViewChild('FilesModal', {static: true}) public focusEl: ElementRef;

    constructor(

      public mfilegroupService: MfilegroupService,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {

        super(mfilegroupService, injector, router, route, location);
        this.setItemNames(itemCamelName);

        this.briefFieldsInfo = [];
        this.briefFieldsInfo.push(['name', 'Name']);



        this.requiredFields = ['name',];


        this.schemaName = 'mfilegroup';
        this.dateFormat = 'MM/DD/YYYY';
        this.timeFormat = 'hh:mm:ss';
        this.modulePath = 'files';
        this.indexFields = ['name', ];
    }
}
