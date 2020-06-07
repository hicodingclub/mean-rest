import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

<% if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MraNgbDateFormatterService } from '../<%-moduleName%>/<%-moduleName%>.directive'; <%_ }%>
import { <%-ModuleName%>_SERVER_ROOT_URI } from '../<%-moduleName%>/<%-moduleName%>.tokens';
import { <%-moduleName%>_server_root_uri } from './<%-moduleName%>.conf';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    
    <%_ if (hasDate) {%>
    NgbModule,<%}%>
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
    { provide: <%-ModuleName%>_SERVER_ROOT_URI, useValue: <%-moduleName%>_server_root_uri },
    <%_ if (hasDate) {%>
    { provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService },<%}%>
  ],
  entryComponents: [
  ],
})
export class <%-ModuleName%>ExtModule { }
