import {
  Component,
  EventEmitter,
  OnInit,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from "@angular/core";

import { getDownloadUrl } from './download-url'
import { MpictureService } from "./mpicture/mpicture.service";
import { MpictureListWidgetGalleryComponent } from "./cust/mpicture-list-widget-gallery.component";

@Component({
  selector: "lib-mdds-picture-select",
  templateUrl: "picture-select.component.html",
  styleUrls: ["picture-select.component.css"],
})
export class PictureSelectComponent
  implements OnInit, OnChanges {
  @Input() downloadUrl: string;
  @Input() aspectRatio: number; // for picture display/select
  @Input() style: any = {};

  @Input() disableDisplay: boolean = false;
  @Input() askForSelect: boolean = false;
  @Output() downloadUrlChange = new EventEmitter<string>();

  public showListWidget: boolean = false;
  @ViewChild(MpictureListWidgetGalleryComponent)
  listWidget: MpictureListWidgetGalleryComponent;

  public componentSubscription;

  constructor(
    private ChangeDetectorRef: ChangeDetectorRef,
    public mpictureService: MpictureService) {}

  ngOnInit() {}

  getDownloadUrl() {
    return getDownloadUrl(this.downloadUrl, false); //not large
  }

  ngOnChanges(changes: SimpleChanges) {
    // changes.prop contains the old and the new value...
    if (changes.askForSelect && changes.askForSelect.currentValue === true) {
      this.selectFileList();
    }
  }

  selectFileList() {
    this.showListWidget = true;
  }
  listWidgetDone(val: boolean) {
    const outputData = this.listWidget.outputData;
    if (outputData) {
      switch (outputData.action) {
        case "selected":
          this.downloadUrl = outputData.detail.link;
          this.downloadUrlChange.emit(this.downloadUrl); // emit the new url to parent.
          break;
        default:
          break;
      }
    }
    if (val) {
      this.showListWidget = false;
      this.ChangeDetectorRef.detectChanges();
    }
  }
}
