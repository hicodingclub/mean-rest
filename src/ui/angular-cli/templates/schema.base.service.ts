import { HttpClient } from '@angular/common/http';
import { MddsBaseService } from '@hicoder/angular-core';

const servicePath = '/<%-schemaName%>/';

export class <%-SchemaName%>BaseService extends MddsBaseService {
    constructor(http: HttpClient, serverRootUrl: string) {
        const serviceUrl = serverRootUrl + servicePath;
        super(http, serviceUrl);
    }
}
