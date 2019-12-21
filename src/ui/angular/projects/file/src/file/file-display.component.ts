import { Component, OnInit, Input } from '@angular/core';
@Component({
    selector: 'lib-mdds-file-display',
    templateUrl: 'file-display.component.html',
    styleUrls: ['file-display.component.css']
})
export class FileDisplayComponent implements OnInit {
    @Input() downloadUrl: string;
    @Input() clickToShow: boolean;
    @Input() isLarge = false;
    @Input() aspectRatio: number;

    public embeddedPicture = false;
    public imgStyle: any = {height: 'auto', width: '100%'};

    constructor() {}

    ngOnInit() {
      if (!this.aspectRatio) {
        // if aspectRatio is not defined, the caller shall fix the height of the image
        this.imgStyle = {height: '100%', width: 'auto'};
      }
    }

    getDownloadUrl() {
        let downloadUrl = this.downloadUrl;
        if (downloadUrl && !downloadUrl.startsWith('data:')) {
            // a real url
            downloadUrl = this.isLarge ? downloadUrl : `${downloadUrl}_thumbnail`;
        }
        return downloadUrl;
    }

    showImageDetail() {
    }
}
