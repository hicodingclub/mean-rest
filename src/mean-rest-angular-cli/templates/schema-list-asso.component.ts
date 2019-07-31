import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListSubComponent } from './<%-schemaName%>-list-sub.component';
import { <%-SchemaName%>Service } from '../<%-schemaName%>.service';
<%for (let asso of associationFor) {
  /* asso:
  which schema(lower case), the schema's formal schema name, the asso field, 
  the Label text triggering the asso, my schemaName (lower case),
  the asso field Schema name
  */

  let assoField = asso[2];
  let assoSchemaName = asso[5];
  let AssoSchemaName = asso[6];
%>import { <%-AssoSchemaName%>ListComponent } from '../../<%-assoSchemaName%>/<%-assoSchemaName%>-list/<%-assoSchemaName%>-list.component';
<%}%>

@Component({
  selector: 'app-<%-schemaName%>-list-asso',
  templateUrl: './<%-schemaName%>-list-asso.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css']
})
export class <%-SchemaName%>ListAssoComponent extends <%-SchemaName%>ListSubComponent implements OnInit {
  @Input('asso') public associationField: string;
  public parentSchema;
  public parentItemId;

  public assoCompInstance: any;
  public assoCompFields;
  public assoCompObjects = [];

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%-schemaName%>Service, injector, router, route, location);
  }

  ngOnInit() {
      if (!this.associationField) {
        // get from param if not given from the component input
        this.associationField = this.route.snapshot.queryParamMap.get('asso');
      }
      <%for (let asso of associationFor) {
        /* asso:
        which schema(lower case), the schema's formal schema name, the asso field, 
        the Label text triggering the asso, my schemaName (lower case),
        the asso field Schema name, and asso field SchemaName
        */
      
        let assoField = asso[2];
        let assoSchemaName = asso[5];
        let AssoSchemaName = asso[6];
      %>if ( this.associationField === '<%-assoField%>') {
        this.assoCompInstance = <%-AssoSchemaName%>ListComponent.getInstance();
      }
      <%}%>

      if (this.assoCompInstance) {
        this.assoCompFields = this.assoCompInstance.briefFieldsInfo;
      }
      
    
      this.parentSchema = this.getParentRouteRefField();
      let ref = this.referenceFieldsReverseMap[this.parentSchema];
      this.ignoreField = ref; // used for export (send to server)

      this.parentItemId = this.getParentRouteItemId();
      let id = this.parentItemId;

      this.detail = {};

      if (this.arrayFields.some(x=>x[0] == ref)) {
          this.detail[ref] = {'selection':[{'_id': id}] }; //search on array list
      } else {
          this.detail[ref] = {'_id': id }; //make this as the search context
      }
      this.searchList().subscribe((done) => {
        if (done) {
          this.assoCompObjects = [];
          for (let item of this.originalList) {
            const o = item[this.associationField];
            //always put to an array
            let oArray = [];
            if (Array.isArray(o)) {
              for (let oo of o) {
                oArray.push(this.assoCompInstance.formatDetail(oo));
              }
            } else if (typeof o === 'object') {
              oArray.push(this.assoCompInstance.formatDetail(o));

            }
            this.assoCompObjects.push(oArray);
          }
        }
      });
  }
}
