import { Component, OnInit, Input, OnChanges, ViewChild } from '@angular/core';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';

import { <%-SchemaName%>ListViewComponent } from './<%-schemaName%>-list-view.component';

@Component({
  selector: 'app-<%-schemaName%>-<%-component_file_name%>',
  templateUrl: './<%-schemaName%>-<%-component_file_name%>.component.html',
  styleUrls: ['./<%-schemaName%>-<%-component_file_name%>.component.css'],
})
export class <%-SchemaName%><%-ComponentClassName%>Component extends <%-SchemaName%>ListViewComponent implements OnInit, OnChanges {
  public titleFn: string;
  public subtitleFn: string;
  public descriptionFn: string;
  public picturelinkFn: string;

  public errMsg: string;

  @ViewChild('carousel', {static: true}) carousel: NgbCarousel;

  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.setFields();
  }

  ngOnChanges() {
    this.setFields();

    if (this.carousel) {
      this.carousel.cycle();
    }
  }

  setFields() {
    if ( !Array.isArray(this.inputData) || this.inputData.length < 4) {
      this.errMsg = "@Input error! inputData in array is expected for slides view: [titleField, subtitleField, descriptionField, pictureLinkField]";
      return;
    }
    this.errMsg = '';
    this.titleFn = this.inputData[0];
    this.subtitleFn = this.inputData[1];
    this.descriptionFn = this.inputData[2];
    this.picturelinkFn = this.inputData[3];
  }
}
