import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

<% if (mFeatures.hasDate) {%>
import { NgbModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { MDDS_NGB_DATE_FORMAT, MraNgbDateFormatterService } from '@hicoder/angular-core'; <%_ }%>

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    
    <%_ if (mFeatures.hasDate) {%>
    NgbModule,<%}%>
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
    <%_ if (mFeatures.hasDate) {%>
    { provide: MDDS_NGB_DATE_FORMAT, useValue: '<%-dateFormat%>'},
    { provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService },<%}%>
  ],
  entryComponents: [
  ],
})
export class <%-ModuleName%>ExtModule { }
