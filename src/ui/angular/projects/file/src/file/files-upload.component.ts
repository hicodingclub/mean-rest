import { Component, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

import { forkJoin } from 'rxjs';

import { processDownloadUrl } from './download-url';
import { MddsFileUploadService, UploadStatus} from './file-upload.service';

@Component({
    selector: 'lib-mdds-files-upload',
    templateUrl: 'files-upload.component.html',
    styleUrls: ['files-upload.component.css']
})
export class FilesUploadComponent implements OnChanges {
    @Input() accept: string[] = [];
      // [] - emptry array means any type.
      // ['image/*'] - any image file
      // ['video/*'] - any video file
      // ['audio/*'] - any audio file
      // ['application/zip', '.zip']  - zip file

    @Input() disableDisplay: boolean = false;
    @Input() askForSelect: boolean = false;
    @Input() multiple: boolean = false;
    @Input() downloadUrl: string;
    @Input() downloadUrls: string[] = [];
    @Output() downloadUrlChange: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('singFile', {static: true}) singFile;
    @ViewChild('multiFiles', {static: true}) multiFiles;

    acceptStr: string = '';

    fileNames: string[] = [];

    public files: Set<File> = new Set();
    progress: UploadStatus;  // progress map
    uploading = false;
    hasSuccessUpload = false;

    constructor(private uploadService: MddsFileUploadService) {}

    ngOnChanges(changes: SimpleChanges) {
      this.acceptStr = this.accept.join(',');
      if (!this.multiple) {
        if (this.downloadUrl) {
          this.downloadUrls = [this.downloadUrl];
        } else {
          this.downloadUrls = [];
        }
      }
      if (this.downloadUrls && this.downloadUrls.length > 0) {
        this.fileNames = this.downloadUrls.map( x => {
          let { uploadFileName } = processDownloadUrl(x);
          return uploadFileName;
        });
      } else {
        this.fileNames = [];
      }

      if (changes.askForSelect && changes.askForSelect.currentValue === true) {
        this.selectFiles();
      }
    }
    selectFiles() {
      if (this.multiple) {
        this.multiFiles.nativeElement.click();
        return;
      }
      this.singFile.nativeElement.click();
    }

    onFilesAdded() {
      // Clear everything;  
      this.files = new Set();
      this.progress = undefined;

      let files;
      if (this.multiple) {
        files = this.multiFiles.nativeElement.files; //array
      } else {
        files = this.singFile.nativeElement.files; //array
      }
      for (const fl of files) {
        this.files.add(fl);
      }

      this.uploadFiles();
    }

    uploadFiles() {
      this.hasSuccessUpload = false;

      // start the upload and save the progress map
      // set fileCategory to file
      this.progress = this.uploadService.upload(this.files, null, 'file');

      // convert the progress map into an array
      const allProgressObservables = [];
      for (const key of Object.keys(this.progress)) {
        allProgressObservables.push(this.progress[key].progress);
      }

      // set the component state to "uploading"
      this.uploading = true;

      // When all progress-observables are completed...
      forkJoin(allProgressObservables).subscribe(end => {
        // ... and the component is no longer uploading
        this.uploading = false;
        for (const key of Object.keys(this.progress)) {
          let prg = this.progress[key];
          if (prg.result.success) {
            this.hasSuccessUpload = true;
            break;
          }
        }
        this.notify();
      });
    }
    notify() {
      this.downloadUrls = [];
      for (const key of Object.keys(this.progress)) {
        let prg = this.progress[key];
        if (prg.result.success) {
          this.downloadUrls.push(this.progress[key].result.value.link);
        }
      }
      if (this.downloadUrls.length > 0) {
        // at least one succeeded
        this.downloadUrl = this.downloadUrls[0];

        if (this.multiple) {
          this.downloadUrlChange.emit(this.downloadUrls);
        } else {
          this.downloadUrlChange.emit(this.downloadUrl);
        }
      }
    }
}
