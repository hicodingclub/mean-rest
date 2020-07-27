import { Component, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';

import { forkJoin } from 'rxjs';

import { MddsFileUploadService, UploadStatus} from './file-upload.service';

@Component({
    selector: 'lib-mdds-file-upload',
    templateUrl: 'file-upload.component.html',
    styleUrls: ['file-upload.component.css']
})
export class FileUploadComponent implements OnChanges {
    @Input() accept: string[] = [];
      // [] - emptry array means any type.
      // ['image/*'] - any image file
      // ['video/*'] - any video file
      // ['audio/*'] - any audio file
      // ['application/zip', '.zip']  - zip file

    @Input() isImage: boolean = false;

    @Input() downloadUrl: string;
    @Output() downloadUrlChange: EventEmitter<string[]> = new EventEmitter<string[]>();
    @ViewChild('file', {static: true}) file;
    public files: Set<File> = new Set();

    progress: UploadStatus;
    canBeClosed = true;
    showCancelButton = true;
    uploading = false;
    uploadSuccessful = true; // no pending files for upload
    selectNew = false; // select or add
    localUrl: string;
    acceptStr: string = '';
    downloadName: string = '';
    localName: string = '';


    constructor(private uploadService: MddsFileUploadService) {}

    ngOnChanges() {
      this.acceptStr = this.accept.join(',');
      if (this.downloadUrl) {
        this.downloadName = this.downloadUrl.substr(this.downloadUrl.lastIndexOf('/')+1);
      }
    }
  
    addFiles() {
      this.file.nativeElement.click();
    }
    selectFiles() {
      this.selectNew = true;
      this.file.nativeElement.click();
    }
    onFilesAdded() {
      if (this.uploadSuccessful || this.selectNew) {
        // Clear the file set;
        this.files = new Set();
        this.uploadSuccessful = false;
        this.selectNew = false;
        this.progress = undefined;
      }

      const files = this.file.nativeElement.files;
      for (const fl of files) {
        console.log('type: ', fl.type);
        this.files.add(fl);
      }
      if (files[0]) {
        this.localUrl = URL.createObjectURL(files[0]);
        this.localName = files[0].name;
      }
    }

    uploadFiles() {
      // if everything was uploaded already, just close the dialog
      //    if (this.uploadSuccessful) {
      //      return this.dialogRef.close();
      //    }
      //
      // set the component state to "uploading"
      this.uploading = true;

      // start the upload and save the progress map
      this.progress = this.uploadService.upload(this.files, null);

      // convert the progress map into an array
      const allProgressObservables = [];
      for (const key of Object.keys(this.progress)) {
        allProgressObservables.push(this.progress[key].progress);
      }

      // The dialog should not be closed while uploading
      this.canBeClosed = false;
      // this.dialogRef.disableClose = true;

      // Hide the cancel-button
      this.showCancelButton = false;

      // When all progress-observables are completed...
      forkJoin(allProgressObservables).subscribe(end => {
        // ... the dialog can be closed again...
        this.canBeClosed = true;
        // this.dialogRef.disableClose = false;

        // ... the upload was successful...
        this.uploadSuccessful = true;
        this.localUrl = null;

        // ... and the component is no longer uploading
        this.uploading = false;

        for (const key of Object.keys(this.progress)) {
          this.downloadUrl = this.progress[key].result.value.link;
          this.downloadName = this.downloadUrl.substr(this.downloadUrl.lastIndexOf('/')+1);

          this.downloadUrlChange.emit([this.downloadUrl, this.localName]);
          break; // only emit one url
        }
      });
    }
}
