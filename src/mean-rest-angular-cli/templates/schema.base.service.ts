import { HttpClient } from '@angular/common/http';
import { BaseService } from 'mean-rest-angular';

const serviceUrl = '/<%-apiBase%>/<%-schemaName%>/';

export class <%-SchemaName%>BaseService extends BaseService {
    constructor(http: HttpClient) {
        super(http, serviceUrl);
    }    
    protected formatDetail(detail:any): any {
        let date = new Date(detail['date']);
        detail['date'] = date.toUTCString();
        return detail;
    }
    
    protected formatList(list:any): any {
        for (let item of list) {
            let date = new Date(item['date']);
            item['date'] = date.toUTCString();
        }
        return list;
    }
}
