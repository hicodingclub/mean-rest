import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';
import { ViewContainerRef,  Directive, ComponentFactoryResolver } from '@angular/core';

import { MddsBaseComponentInterface } from '@hicoder/angular-core';

import { MfileListWidgetGalleryComponent } from './mfile/mfile-list/mfile-list-widget-gallery.component'
@Directive({
  selector: '[libMddsFileSelect]',
})
export class MddsFileSelectDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'lib-mdds-file-select',
    templateUrl: 'file-select.component.html',
    styleUrls: ['file-select.component.css']
})
export class FileSelectComponent implements OnInit {
    @Input() downloadUrl: string;
    @Input() aspectRatio: number;
    @Output() downloadUrlChange = new EventEmitter<string>();

    @ViewChild(MddsFileSelectDirective, {static: true}) refSelectDirective: MddsFileSelectDirective;

    public componentSubscription;

    constructor(
      private componentFactoryResolver: ComponentFactoryResolver,
    ) {}

    ngOnInit() {}

    getDownloadUrl() {
      const downloadUrl = this.downloadUrl;
      if (downloadUrl && !downloadUrl.startsWith('data:')) {
          // a real url
          return `${downloadUrl}_thumbnail`;
      }
      return downloadUrl;
    }

    selectFileList() {
      const viewContainerRef = this.refSelectDirective.viewContainerRef;
      viewContainerRef.clear();

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(MfileListWidgetGalleryComponent);
      const componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call

      const componentInstance = componentRef.instance as MddsBaseComponentInterface;
      componentInstance.setFocus();
      componentInstance.inputData = ['name', 'link'];
      componentInstance.options = {canSelect: true, largePicture: false, showTitle: true, aspectRatio: this.aspectRatio};

      this.componentSubscription = componentInstance.done.subscribe( (val) => {
        const outputData = componentInstance.outputData;
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
          this.componentSubscription.unsubscribe();
          viewContainerRef.clear(); // only detach. not destroy
        }
      });

    }
}
