import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

<% if (hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MraNgbDateFormatterService } from '../<%-moduleName%>/<%-moduleName%>.directive'; <%_ }%>

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
    <%_ if (hasDate) {%>
    { provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService },<%}%>
  ],
  entryComponents: [
  ],
})
export class <%-ModuleName%>ExtModule { }
