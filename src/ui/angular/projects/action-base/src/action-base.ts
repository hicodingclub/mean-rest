import { NgModule } from '@angular/core';
import { Output, EventEmitter, Component } from '@angular/core';

@Component({
    template: '',
})
export class ActionBase {
    @Output()
    public componentEvents = new EventEmitter<any>();

    constructor() {}

    public emitEvent(evt: any) {
        this.componentEvents.emit(evt);
    }
}

@NgModule({
    declarations: [ActionBase],
    imports: [],
    exports: [],
    providers: [],
    entryComponents: [],
})
export class LibModule { }
