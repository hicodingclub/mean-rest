import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-<%-moduleName%>',
  templateUrl: './<%-moduleName%>.component.html',
  styleUrls: ['./<%-moduleName%>.component.css']
})
export class <%-ModuleName%>Component implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
