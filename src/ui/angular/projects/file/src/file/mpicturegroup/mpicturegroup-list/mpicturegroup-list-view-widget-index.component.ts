import {
  Component,
  OnInit
} from '@angular/core';
import {
  MpicturegroupListViewComponent
} from './mpicturegroup-list-view.component';
@Component({
  selector: 'app-mpicturegroup-list-view-widget-index',
  templateUrl: './mpicturegroup-list-view-widget-index.component.html',
  styleUrls: ['./mpicturegroup-list-view-widget-index.component.css'],
})
export class MpicturegroupListViewWidgetIndexComponent extends MpicturegroupListViewComponent implements OnInit {
  constructor() {
    super();
  }
  ngOnInit() {
    super.ngOnInit();
  }
}