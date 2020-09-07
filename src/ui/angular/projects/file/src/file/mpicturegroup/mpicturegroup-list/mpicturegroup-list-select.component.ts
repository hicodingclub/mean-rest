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
  MpicturegroupListComponent
} from './mpicturegroup-list.component';
import {
  MpicturegroupService
} from '../mpicturegroup.service';
@Component({
  selector: 'app-mpicturegroup-list-select',
  templateUrl: './mpicturegroup-list-select.component.html',
  styleUrls: ['./mpicturegroup-list.component.css', './mpicturegroup-list-select.component.css']
})
export class MpicturegroupListSelectComponent extends MpicturegroupListComponent implements OnInit {
  public clickItemAction: string = '';
  public cardHasLink: boolean = false;
  public cardHasSelect: boolean = true;
  public includeSubDetail: boolean = false;
  public canUpdate: boolean = false;
  public canDelete: boolean = false;
  public canArchive: boolean = false;
  public canCheck: boolean = false;
  public itemMultiSelect: boolean = false;
  public majorUi: boolean = false;
  constructor(public mpicturegroupService: MpicturegroupService, public injector: Injector, public router: Router, public route: ActivatedRoute, public location: Location) {
    super(mpicturegroupService, injector, router, route, location);
    this.listViews = ['index', ];
    this.listViewFilter = 'index';
  }
  ngOnInit() {
    this.queryOnNgInit = false; // don't do query on the super class.
    super.ngOnInit();
    this.listCategory1 = {}; // no do query based on category;
    this.listCategory2 = {}; // no do query based on category;
    this.selectedId = this.inputData;
    this.searchList();
  }
}