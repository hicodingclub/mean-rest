import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { <%-ModuleName%>CoreModule } from '../<%-moduleName%>/<%-moduleName%>.core.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

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
