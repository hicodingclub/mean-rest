import { Injectable, Inject, OnDestroy, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { <%-SchemaName%>BaseService } from './<%-schemaName%>.base.service';
import { <%-ModuleName%>_SERVER_ROOT_URI } from '../<%-moduleName%>.tokens';

@Injectable({
    providedIn: 'root',
})
export class <%-SchemaName%>Service extends <%-SchemaName%>BaseService implements OnDestroy {
    constructor(
        http: HttpClient,
        @Inject(<%-ModuleName%>_SERVER_ROOT_URI) private <%-moduleName%>ServerRootUri: string) {
        super(http, <%-moduleName%>ServerRootUri);
    }
    ngOnDestroy() { }
}
