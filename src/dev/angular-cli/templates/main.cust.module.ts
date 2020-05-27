import { NgModule } from '@angular/core';
import { <%-ModuleName%>CoreModule } from '../<%-moduleName%>/<%-moduleName%>.core.module';

@NgModule({
  imports: [
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
