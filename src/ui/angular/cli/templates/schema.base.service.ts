import { HttpClient } from '@angular/common/http';
import { BaseService } from '@hicoder/angular-core';

const servicePath = '/<%-schemaName%>/';

export class <%-SchemaName%>BaseService extends BaseService {
    constructor(http: HttpClient, serverRootUrl: string) {
        const serviceUrl = serverRootUrl + servicePath;
        super(http, serviceUrl);
    }
}
