import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute }    from '@angular/router';
import { Injector } from '@angular/core';

import { <%-SchemaName%>ListComponent } from './<%-schemaName%>-list.component';
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
  selector: 'app-<%-schemaName%>-<%-component_file_name%>',
  templateUrl: './<%-schemaName%>-<%-component_file_name%>.component.html',
  styleUrls: ['./<%-schemaName%>-list.component.css', './<%-schemaName%>-<%-component_file_name%>.component.css']
})
export class <%-SchemaName%><%-ComponentClassName%>Component extends <%-SchemaName%>ListComponent implements OnInit {
  public clickItemAction: string = '<%-listViewObj.clickItemAction%>';
  public cardHasLink: boolean = <%-listViewObj.cardHasLink%>;
  public cardHasSelect: boolean = <%-listViewObj.cardHasSelect%>;
  public includeSubDetail: boolean = <%-listViewObj.includeSubDetail%>;
  public canUpdate: boolean = <%-listViewObj.canUpdate%>;
  public canDelete: boolean = <%-listViewObj.canDelete%>;
  public canArchive: boolean = <%-listViewObj.canArchive%>;
  public canCheck: boolean = <%-listViewObj.canCheck%>;
  public itemMultiSelect: boolean = <%-listViewObj.itemMultiSelect%>;
  public majorUi: boolean = <%-listViewObj.majorUi%>;
  
  public parentSchema;
  public parentItemId;

  constructor(
      public <%-schemaName%>Service: <%-SchemaName%>Service,
      public injector: Injector,
      public router: Router,
      public route: ActivatedRoute,
      public location: Location) {
        super(<%-schemaName%>Service, injector, router, route, location);

        this.listViews = [ <%for (let widget of widgetDef.views) {%>'<%-widget%>', <%}%>];
        this.listViewFilter = '<%-widgetDef.views[0]%>';
  }

  ngOnInit() {
    this.queryOnNgInit = false; // don't do query on the super class.
    super.ngOnInit();

    this.listCategory1 = {}; // no do query based on category;
    this.listCategory2 = {}; // no do query based on category;

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

    let ref = this.getParentRouteRefField();
    this.parentSchema = this.referenceFieldsReverseMap[ref];

    this.ignoreField = ref; // used for export (send to server)

    this.parentItemId = this.getParentRouteItemId();
    let id = this.parentItemId;
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
          } else {
            oArray.push({}); // empty object
          }
          this.assoCompObjects.push(oArray);
        }
      }
    });
  }
}
