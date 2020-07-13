import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';

import Cropper from 'cropperjs';

@Component({
  selector: 'lib-mdds-cropper',
  templateUrl: 'mdds-cropper.component.html',
  styleUrls: ['./mdds-cropper.component.css'],
})
export class MddsCropperComponent implements OnInit, AfterViewInit {
  @Input() downloadUrl: string;
  @Input() aspectRatio: number;
  @Output() cropper = new EventEmitter<any>();

  cropperInstance: Cropper;
  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    const el = document.getElementById('mdds-cropper-container') as HTMLImageElement;
    this.cropperInstance = new Cropper(el, {
      dragMode: 'move',
      aspectRatio: this.aspectRatio || NaN,
      zoomable: true,
      zoomOnWheel: true,
      autoCropArea: 0.81, // 0.9 * 0.9 with two zoomin
    });
    this.cropper.emit(this.cropperInstance);
  }

  zoomIn() {
    this.cropperInstance.zoom(0.1);
  }
  zoomOut() {
    this.cropperInstance.zoom(-0.1);
  }
}
