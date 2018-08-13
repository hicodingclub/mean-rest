import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { <%-SchemaName%>BaseService } from './<%-schemaName%>.base.service';
 
@Injectable(
)
export class <%-SchemaName%>Service extends <%-SchemaName%>BaseService implements OnDestroy {    
    constructor(http: HttpClient) {
        super(http);
    }
    ngOnDestroy() { }
}
