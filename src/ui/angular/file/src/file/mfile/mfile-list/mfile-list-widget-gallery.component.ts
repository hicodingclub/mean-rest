import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { forkJoin } from 'rxjs';

import { MddsUncategorized } from '@hicoder/angular-core';

import { MfileListComponent } from './mfile-list.component';
import { MfileService } from '../mfile.service';

import { MddsFileUploadService, uploadStatus} from '../../file-upload.service';

@Component({
  selector: 'app-mfile-list-widget-gallery',
  templateUrl: './mfile-list-widget-gallery.component.html',
  styleUrls: ['./mfile-list.component.css', './mfile-list-widget-gallery.component.css'],
})
export class MfileListWidgetGalleryComponent extends MfileListComponent implements OnInit {
  public titleFn: string;
  public picturelinkFn: string;
  @Input() options: any = {}; // {canSelect: true, largePicture: true, showTitle: true};
  public selectedIdx;

  @ViewChild('FilesModal') public focusEl: ElementRef;
  @ViewChild('file') public file;

  public files: Set<File> = new Set();

  progress: uploadStatus;
  canBeClosed: boolean = true; 
  showCancelButton: boolean = true; 
  uploading: boolean = false;
  uploadSuccessful: boolean = true; // no pending files for upload
  selectNew: boolean = false; // select or add
  localImage: string;

  uploadingFiles = [];

  constructor(
      public mfileService: MfileService,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location,
      private uploadService: MddsFileUploadService) {
        super(null, mfileService, injector, router, route, location);
        this.majorUi = false;
  }


  ngOnInit() {
    // this.inputData == this.inputData|| [] // expect field name in array: ['subtitle', 'description', 'picture']
    if ( !Array.isArray(this.inputData) || this.inputData.length < 2) {
      console.error("inputData of array is expected for gallery view: titleFn, picturelinkFn");
      return;
    }

    this.titleFn = this.inputData[0];
    this.picturelinkFn = this.inputData[1];
    super.ngOnInit();
  }

  // select new files from file system
  selectFiles() {
    this.selectNew = true;
    this.file.nativeElement.click();
  }

  // one or multiple files selected from local file system
  onFilesSelected() {
    if (this.uploadSuccessful || this.selectNew) {
      // Clear the file set;
      this.files = new Set();
      this.uploadSuccessful = false;
      this.selectNew = false;
      this.progress = undefined;

      this.uploadingFiles = []; // clear
    }
    
    const files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
        this.uploadingFiles.push(files[key].name);
      }
    }

    //this.localImage = URL.createObjectURL(files['0']);
    
    this.uploadFiles();
  }

  uploadFiles() {
    // if everything was uploaded already, just close the dialog
    //    if (this.uploadSuccessful) {
    //      return this.dialogRef.close();
    //    }
    //  
    // set the component state to "uploading"
    this.uploading = true;
  
    let groupName = this.categories[this.selectedCategory]['group']['_id'];
    if (groupName === MddsUncategorized) {
      groupName = null;
    }
    // start the upload and save the progress map
    this.progress = this.uploadService.upload(this.files, groupName);
  
    // convert the progress map into an array
    let allProgressObservables = [];
    for (let key in this.progress) {
      allProgressObservables.push(this.progress[key].progress);
    }

    // The dialog should not be closed while uploading
    this.canBeClosed = false;
    //this.dialogRef.disableClose = true;
  
    // Hide the cancel-button
    this.showCancelButton = false;
  
    // When all progress-observables are completed...
    forkJoin(allProgressObservables).subscribe(end => {
      // ... the dialog can be closed again...
      this.canBeClosed = true;
      //this.dialogRef.disableClose = false;
  
      // ... the upload was successful...
      this.uploadSuccessful = true;
      this.localImage = null;
  
      // ... and the component is no longer uploading
      this.uploading = false;

      this.uploadingFiles = []; //clear
      this.files = new Set();
      for (let key in this.progress) {
        const success = this.progress[key].result.success;
        if (success) {
          const fileObj = this.progress[key].result.value;
          this.list.push(this.formatDetail(fileObj));
          this.categoriesCounts[this.selectedCategory] += 1; // update the category count of the current selected category
        } else {
          this.uploadingFiles.push(key);
        }
      }
    });
  }

  public onGroupAdded(result: any) {
    if (result) { //add successful. Re-populate the current list
      this.categoryDisplays.push(result.name);
      this.categories.push({
        group: result
      });
      this.categoriesCounts.push(0);
    } else {
        ; //do nothing
    }
  }
  // rewite. Just close the pop up
  public onActionDone(result: boolean) {
    this.isAdding = false;
  }
}
