import { HttpClient } from '@angular/common/http';
import { BaseService } from 'mean-rest-angular';

const serviceUrl = '/<%-apiBase%>/<%-schemaName%>/';

export class <%-SchemaName%>BaseService extends BaseService {
    constructor(http: HttpClient) {
        super(http, serviceUrl);
    }    
}
