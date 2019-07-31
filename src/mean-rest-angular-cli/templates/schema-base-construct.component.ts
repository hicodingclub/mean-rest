
  this.briefFieldsInfo = [];
  <%for (let f of briefView) {%>this.briefFieldsInfo.push(['<%-f.fieldName%>', '<%-f.displayName%>']);
  <%}%>