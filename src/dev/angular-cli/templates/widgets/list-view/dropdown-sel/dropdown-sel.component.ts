import { Component, OnInit, Input } from '@angular/core';

import { <%-SchemaName%>ListViewComponent } from './<%-schemaName%>-list-view.component';

@Component({
  selector: 'app-<%-schemaName%>-<%-component_file_name%>',
  templateUrl: './<%-schemaName%>-<%-component_file_name%>.component.html',
  styleUrls: ['./<%-schemaName%>-<%-component_file_name%>.component.css'],
})
export class <%-SchemaName%><%-ComponentClassName%>Component extends <%-SchemaName%>ListViewComponent implements OnInit {
  constructor() {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
  }

  public dropdownChanged(idx: number) {
    this.clearSelectItems();
    this.selectOneItem(idx);
  }
}
