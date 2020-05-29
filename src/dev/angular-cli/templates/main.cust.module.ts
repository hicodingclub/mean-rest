import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { <%-ModuleName%>CoreModule } from '../<%-moduleName%>/<%-moduleName%>.core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
  
    <%-ModuleName%>CoreModule,
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
  ],
  entryComponents: [
  ],
})
export class <%-ModuleName%>CustModule { }
