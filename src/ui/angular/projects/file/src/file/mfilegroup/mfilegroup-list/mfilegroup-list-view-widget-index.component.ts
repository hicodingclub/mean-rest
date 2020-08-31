import {
  Component,
  OnInit
} from '@angular/core';
import {
  MfilegroupListViewComponent
} from './mfilegroup-list-view.component';
@Component({
  selector: 'app-mfilegroup-list-view-widget-index',
  templateUrl: './mfilegroup-list-view-widget-index.component.html',
  styleUrls: ['./mfilegroup-list-view-widget-index.component.css'],
})
export class MfilegroupListViewWidgetIndexComponent extends MfilegroupListViewComponent implements OnInit {
  constructor() {
    super();
  }
  ngOnInit() {
    super.ngOnInit();
  }
}