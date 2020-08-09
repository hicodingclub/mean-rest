import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  AfterViewInit
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
  MfilegroupListComponent
} from './mfilegroup-list.component';
import {
  MfilegroupService
} from '../mfilegroup.service';
@Component({
  selector: 'app-mfilegroup-list-select',
  templateUrl: './mfilegroup-list-select.component.html',
  styleUrls: ['./mfilegroup-list.component.css']
})
export class MfilegroupListSelectComponent extends MfilegroupListComponent
implements OnInit {
  // @Input() inputData;
  // @Output() outputData;
  done = new EventEmitter < boolean > ();
  constructor(public mfilegroupService: MfilegroupService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(mfilegroupService, injector, router, route, location);
    this.majorUi = false;
    this.itemMultiSelect = false;
  }
  ngOnInit() {
    this.selectedId = this.inputData;
    this.populateList();
  }
}