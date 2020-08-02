<% if (mFeatures.hasDate) {%>
{ provide: MDDS_NGB_DATE_FORMAT, useValue: '<%-dateFormat%>'},
{ provide: NgbDateParserFormatter, useClass: MraNgbDateFormatterService },<%
}%>