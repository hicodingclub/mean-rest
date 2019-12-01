import { Component, EventEmitter, Input, Output, ViewChild, } from '@angular/core';
import { ViewContainerRef,  Directive, ComponentFactoryResolver, ElementRef } from '@angular/core';

import { BaseComponentInterface } from '@hicoder/angular-core';

import { MfileListWidgetGalleryComponent } from './mfile/mfile-list/mfile-list-widget-gallery.component'

@Directive({
  selector: '[mdds-file-select]',
})
export class MddsFileSelectDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'file-select',
    templateUrl: 'file-select.component.html',
    styleUrls: ['file-select.component.css']
})
export class FileSelectComponent {
    @Input() downloadUrl: string;
    @Output() downloadUrlChange = new EventEmitter<string>();  
    
    @ViewChild(MddsFileSelectDirective) refSelectDirective: MddsFileSelectDirective;


    public componentSubscription;

    constructor(
      private componentFactoryResolver: ComponentFactoryResolver,
    ) {}
    
    ngOnInit() {
    }
    
    selectFileList() {
      const viewContainerRef = this.refSelectDirective.viewContainerRef;
      viewContainerRef.clear();

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(MfileListWidgetGalleryComponent);
      const componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call

      let componentInstance = <BaseComponentInterface>componentRef.instance;
      componentInstance.setFocus();
      componentInstance.inputData = ['name', 'link'];
      componentInstance.options = {canSelect: true, largePicture: false, showTitle: true};

      this.componentSubscription = componentInstance.done.subscribe( (val) => {
        let outputData = componentInstance.outputData;
        if (outputData) {
          switch (outputData.action){
            case "selected":
              this.downloadUrl = outputData.detail['link'];

              this.downloadUrlChange.emit(this.downloadUrl); // emit the new url to parent.
              break;
            default:
              break;
          }                
        }
        if (val) {
          this.componentSubscription.unsubscribe();
          viewContainerRef.clear(); //only detach. not destroy
        }
      });

    }
}
