import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";
import { Location } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { Injector } from "@angular/core";

import { forkJoin } from "rxjs";

import Cropper from "cropperjs";

import { MddsUncategorized } from "@hicoder/angular-core";

import { MpictureListComponent } from "../mpicture/mpicture-list/mpicture-list.component";
import { MpictureService } from "../mpicture/mpicture.service";

import { MddsFileUploadService, UploadStatus } from "../file-upload.service";
import { _appIdRandomProviderFactory } from "@angular/core/src/application_tokens";

import { MddsFileCrop } from '../download-url';

@Component({
  selector: "lib-mpicture-list-widget-gallery",
  templateUrl: "./mpicture-list-widget-gallery.component.html",
  styleUrls: [
    "../mpicture/mpicture-list/mpicture-list.component.css",
    "../mpicture/mpicture-list/mpicture-list-general.component.css",
    "./mpicture-list-widget-gallery.component.css",
  ],
})
export class MpictureListWidgetGalleryComponent extends MpictureListComponent
  implements OnInit {
  public titleFn: string;
  public picturelinkFn: string;
  @Input() options: any = {}; // {canSelect: true, largePicture: true, showTitle: true, aspectRaio};
  public selectedIdx;

  @ViewChild("FilesModal", { static: true }) public focusEl: ElementRef;
  @ViewChild("file", { static: true }) public file;

  public files: Set<File> = new Set();

  progress: UploadStatus;
  canBeClosed = true;
  showCancelButton = true;
  uploading = false;
  uploadSuccessful = true; // no pending files for upload
  selectNew = false; // select or add
  localImage: string;

  stepTitle: string;

  uploadingFiles = [];

  croppingPictureLink: string;
  selectedFileName: string;
  cropper: Cropper;

  constructor(
    public mpictureService: MpictureService,
    public injector: Injector,
    public router: Router,
    public route: ActivatedRoute,
    public location: Location,
    private uploadService: MddsFileUploadService
  ) {
    super(mpictureService, injector, router, route, location);
    this.majorUi = false;
    this.listViewFilter = 'gallery-bottom-title';
  }

  ngOnInit() {
    // this.inputData == this.inputData|| [] // expect field name in array: ['subtitle', 'description', 'picture']
    if (!Array.isArray(this.inputData) || this.inputData.length < 2) {
      console.error(
        "inputData of array is expected for gallery view: titleFn, picturelinkFn"
      );
      return;
    }

    this.stepTitle = `Select ${this.ItemCamelName}`;

    this.titleFn = this.inputData[0];
    this.picturelinkFn = this.inputData[1];
    this.clickItemAction = "select";
    this.itemMultiSelect = false;
    this.urlCate1 = "MddsUncategorized"; // search "uncategorized"
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

    const files = this.file.nativeElement.files; //array
    for (const fl of files) {
      this.files.add(fl);
      this.uploadingFiles.push(fl.name);
    }

    // this.localImage = URL.createObjectURL(files['0']);
    this.uploading = true;
    this.uploadFiles(null, () => {
      for (const key of Object.keys(this.progress)) {
        const success = this.progress[key].result.success;
        if (success) {
          const fileObj = this.progress[key].result.value;
          this.list.push(this.formatDetail(fileObj));
          this.categoriesCounts[this.selectedCategory] += 1; // update the category count of the current selected category
        } else {
          this.uploadingFiles.push(key);
        }
      }
      this.uploading = false;
    });
  }

  uploadFiles(grpName, callBack) {
    // if everything was uploaded already, just close the dialog
    //    if (this.uploadSuccessful) {
    //      return this.dialogRef.close();
    //    }
    //
    // set the component state to "uploading"
    let groupName = this.categories[this.selectedCategory].group._id;
    if (groupName === MddsUncategorized) {
      groupName = null;
    }
    if (grpName) {
      // use given group name
      groupName = grpName;
    }
    // start the upload and save the progress map
    this.progress = this.uploadService.upload(this.files, groupName, 'picture');

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
    forkJoin(allProgressObservables).subscribe((end) => {
      // ... the dialog can be closed again...
      this.canBeClosed = true;
      // this.dialogRef.disableClose = false;

      // ... the upload was successful...
      this.uploadSuccessful = true;
      this.localImage = null;

      this.uploadingFiles = []; // clear
      this.files = new Set();
      if (callBack) {
        callBack();
      }
    });
  }

  public onGroupAdded(result: any) {
    if (result) {
      // add successful. Re-populate the current list
      this.categoryDisplays.push(result.name);
      this.categories.push({
        group: result,
      });
      this.categoriesCounts.push(0);
    } else {
      // do nothing
    }
  }
  // rewite. Just close the pop up
  public onActionDone(result: boolean) {
    this.isAdding = false;
  }

  // overload the base one
  selectConfirmed() {
    this.uploadingFiles = []; // clear

    const detail = this.getSelectedItems()[0];
    this.croppingPictureLink = detail.link;
    this.selectedFileName = detail._id;
    this.stepTitle = `Crop Picture`;
  }

  cropperCreated(cropper) {
    this.cropper = cropper;
  }
  // overload the base one
  selectItemConfirmed() {
    this.uploading = true; // bring up the spinner. Don't put inside getCroppedCanvas

    this.cropper.getCroppedCanvas().toBlob(
      (blob) => {
        // convert to a file
        const b: any = blob;
        b.lastModifiedDate = new Date();
        b.name = this.selectedFileName;

        const f = blob as File;

        this.uploadSuccessful = false;
        this.selectNew = false;
        this.progress = undefined;

        this.files = new Set();
        this.uploadingFiles = []; // clear

        this.files.add(f);
        this.uploadingFiles.push(f.name);
        this.uploadFiles(MddsFileCrop, () => {
          const success = this.progress[f.name].result.success;
          if (success) {

            const fileObj = this.progress[f.name].result.value;
            this.outputData = {
              action: "selected",
              detail: fileObj,
              value: undefined,
            };
            this.done.emit(true);
          } else {
            this.uploadingFiles.push(f.name);
          }
          this.uploading = false;
        });
      },
      "image/jpeg",
      0.9
    );
  }

  backSelect() {
    this.croppingPictureLink = undefined;
    this.stepTitle = `Select ${this.ItemCamelName}`;
    this.uploadingFiles = []; // clear
  }
}
