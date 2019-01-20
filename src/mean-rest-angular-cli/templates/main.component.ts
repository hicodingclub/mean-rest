import { Component, OnInit } from '@angular/core';

<% if (hasRef) { %>
import { ViewContainerRef,  Directive} from '@angular/core';
@Directive({
  selector: '[<%-moduleName%>-ref-select]',
})
export class <%-ModuleName%>RefSelectDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
<% } %>
@Component({
  selector: 'app-<%-moduleName%>',
  templateUrl: './<%-moduleName%>.component.html',
  styleUrls: ['./<%-moduleName%>.component.css'],
})
export class <%-ModuleName%>Component implements OnInit {

  constructor() { }

  ngOnInit() {
  }
}
