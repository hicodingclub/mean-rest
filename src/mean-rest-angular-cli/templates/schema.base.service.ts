import { HttpClient } from '@angular/common/http';
import { BaseService, formatReference } from 'mean-rest-angular';

const serviceUrl = '/<%-apiBase%>/<%-schemaName%>/';

export class <%-SchemaName%>BaseService extends BaseService {
    constructor(http: HttpClient) {
        super(http, serviceUrl);
    }    
    protected formatDetail(detail:any): any {
        //let date = new Date(detail['date']);
        //detail['date'] = date.toUTCString();
<%_ let objects = [];
    for (let field of detailView) { 
        if (field.type === "ObjectId") objects.push(field.fieldName);
    }
    if (objects.length > 0) {%>
        let referenceFields = [<%for (let fnm of objects) {%>'<%-fnm%>',<%}%>];
        detail = formatReference(referenceFields, detail);       
    <%}%> 
        return detail;
    }
    
    protected formatList(list:any): any {
      if (!list.items) {
          console.warn("No itmes property in returned object for list view....");
          return list;
      }
      for (let i = 0; i < list.items.length; i++) {
        let detail = list.items[i];
<%_ let objects2 = [];
    for (let field of briefView) { 
        if (field.type === "ObjectId") objects2.push(field.fieldName);
    }
    if (objects2.length > 0) {%>
        let referenceFields = [<%for (let fnm of objects2) {%>'<%-fnm%>',<%}%>];
        list.items[i] = formatReference(referenceFields, detail);
<%}%>
      }
      return list;
    }
}
