import { Component, EventEmitter, OnInit, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

import { MfileListWidgetGalleryComponent } from './mfile/mfile-list/mfile-list-widget-gallery.component'

@Component({
    selector: 'lib-mdds-file-select',
    templateUrl: 'file-select.component.html',
    styleUrls: ['file-select.component.css']
})
export class FileSelectComponent implements OnInit, OnChanges {
    @Input() downloadUrl: string;
    @Input() aspectRatio: number;
    @Input() disableDisplay: boolean = false;
    @Input() askForSelect: boolean = false;
    @Output() downloadUrlChange = new EventEmitter<string>();

    public showListWidget: boolean = false;
    @ViewChild(MfileListWidgetGalleryComponent) listWidget: MfileListWidgetGalleryComponent;

    public componentSubscription;

    constructor() {}

    ngOnInit() {}

    getDownloadUrl() {
      const downloadUrl = this.downloadUrl;
      if (downloadUrl && !downloadUrl.startsWith('data:')) {
          // a real url
          return `${downloadUrl}_thumbnail`;
      }
      return downloadUrl;
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
        switch (outputData.action){
          case 'selected':
            this.downloadUrl = outputData.detail.link;
            this.downloadUrlChange.emit(this.downloadUrl); // emit the new url to parent.
            break;
          default:
            break;
        }
      }

      if (val) {
        this.showListWidget = false;
      }
    }
}
