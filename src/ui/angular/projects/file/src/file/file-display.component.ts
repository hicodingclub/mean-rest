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
    @Input() style: any = {};
    
    public embeddedPicture = false;

    constructor() {}

    ngOnInit() {
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
