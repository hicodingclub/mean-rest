/*
 * Public API Surface of action-base
 */

import { Output, EventEmitter } from '@angular/core';

export class ActionBase {
    @Output()
    public componentEvents = new EventEmitter<any>();

    constructor() {}

    public emitEvent(evt: any) {
        this.componentEvents.emit(evt);
    }
}

