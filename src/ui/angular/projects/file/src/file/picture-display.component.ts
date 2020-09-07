import { Component, OnInit, Input, OnChanges } from "@angular/core";

import { getDownloadUrl } from './download-url';

import { MpictureService } from "./mpicture/mpicture.service";

@Component({
  selector: "lib-mdds-picture-display",
  templateUrl: "picture-display.component.html",
  styleUrls: ["picture-display.component.css"],
})
export class PictureDisplayComponent
  implements OnInit, OnChanges {
  @Input() downloadUrl: string;
  @Input() aspectRatio: number; // for picture display/select
  @Input() style: any = {};

  @Input() clickToShow: boolean;
  @Input() isLarge = false;

  constructor(public mpictureService: MpictureService) {}

  ngOnInit() {}

  ngOnChanges() {}

  getDownloadUrl() {
    return getDownloadUrl(this.downloadUrl, this.isLarge);
  }
  showImageDetail() {}
}
