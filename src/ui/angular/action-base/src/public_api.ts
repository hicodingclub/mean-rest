import { Output, EventEmitter } from '@angular/core';

export class ActionBase {
    @Output()
    public componentEvents = new EventEmitter<any>();

    public emitEvent(evt: any) {
        this.componentEvents.emit(evt);
    }
}
