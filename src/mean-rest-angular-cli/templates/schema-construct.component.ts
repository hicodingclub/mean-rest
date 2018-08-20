<%_ for (let field of theView) { let fn = field.fieldName;
        if (field.enumValues) {%>
          this.enums['<%-fn%>'] = [<%for (let ev of field.enumValues) {%>'<%-ev%>',<%}%>]; <%}}%>
<%_ let refObjects = [];
    for (let field of theView) { 
        if (field.type === "ObjectId") refObjects.push(field.fieldName);
    }
    if (refObjects.length > 0) {%>
          this.referenceFields = [<%for (let fnm of refObjects) {%>'<%-fnm%>',<%}%>];<%}%>
<%_ let dateObjects = [];
    for (let field of theView) { 
        if (field.type === "SchemaDate") dateObjects.push(field.fieldName);
    }
    if (dateObjects.length > 0) {%>
          this.dateFields = [<%for (let fnm of dateObjects) {%>'<%-fnm%>',<%}%>];<%}%>