
        this.briefFieldsInfo = [];
        <%for (let f of briefView) {%>this.briefFieldsInfo.push(['<%-f.fieldName%>', '<%-f.displayName%>']);<%}%>


<%_ let refObjects = [];
  for (let field of compositeEditBriefView) { 
      if (field.type === "ObjectId"){ refObjects.push([field.fieldName, field.ref]);}
  }
  if (refObjects.length > 0) {%>
        this.referenceFieldsMap = {<%for (let itm of refObjects) {%>'<%-itm[0]%>': '<%-itm[1]%>',<%}%>};
        this.referenceFieldsReverseMap = {<%for (let itm of refObjects) {%>'<%-itm[1]%>': '<%-itm[0]%>',<%}%>};<%}%>
