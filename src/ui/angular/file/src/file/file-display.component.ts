import { Component, Inject, Input } from '@angular/core';

@Component({
    selector: 'file-display',
    templateUrl: 'file-display.component.html',
    styleUrls: ['file-display.component.css']
})
export class FileDisplayComponent {
    @Input() downloadUrl: string;
    @Input() clickToShow: boolean;
    @Input() isLarge: boolean = false;

    constructor() {}
    
    ngOnInit() {}
    
    showImageDetail() {
    }
}
