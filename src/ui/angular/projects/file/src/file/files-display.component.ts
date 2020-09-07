import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { processDownloadUrl } from './download-url';

@Component({
    selector: 'lib-mdds-files-display',
    templateUrl: 'files-display.component.html',
    styleUrls: ['files-display.component.css']
})
export class FilesDisplayComponent implements OnChanges {
    @Input() downloadUrls: string[] = [];

    public fileNames: string[] = [];

    constructor() {}

    ngOnChanges(changes: SimpleChanges) {
      if (this.downloadUrls && this.downloadUrls.length > 0) {
        this.fileNames = this.downloadUrls.map( x => {
          let { uploadFileName } = processDownloadUrl(x);
          return uploadFileName;
        });
      } else {
        this.fileNames = [];
      }
    }
}
