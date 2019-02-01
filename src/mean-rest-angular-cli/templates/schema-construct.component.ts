<%_ for (let field of theView) { let fn = field.fieldName;
        if (field.enumValues) {%>
          this.enums['<%-fn%>'] = [<%for (let ev of field.enumValues) {%>'<%-ev%>', <%}%>];<%}}%>
<%_ for (let field of theView) { let fn = field.fieldName;
        if (field.type == "SchemaString") {%>
          this.stringFields.push('<%-fn%>');<%}}%>
<%_ let refObjects = [];
    for (let field of theView) { 
        if (field.type === "ObjectId"){ refObjects.push([field.fieldName, field.ref]);}
    }
    if (refObjects.length > 0) {%>
          this.referenceFields = [<%for (let itm of refObjects) {%>'<%-itm[0]%>', <%}%>];
          this.referenceFieldsMap = {<%for (let itm of refObjects) {%>'<%-itm[0]%>': '<%-itm[1]%>',<%}%>};<%}%>
<%_ let dateObjects = [];
    for (let field of theView) { 
        if (field.type === "SchemaDate") dateObjects.push(field.fieldName);
    }
    if (dateObjects.length > 0) {%>
          this.dateFields = [<%for (let fnm of dateObjects) {%>'<%-fnm%>', <%}%>];<%}%>
<%_ let multiSelectionFields = [];
    for (let field of theView) { 
        if (field.type === "SchemaArray" && field.enumValues && field.elementUnique) multiSelectionFields.push(field.fieldName);
    }
    if (multiSelectionFields.length > 0) {%>
          this.multiSelectionFields = [<%for (let fnm of multiSelectionFields) {%>'<%-fnm%>', <%}%>];<%}%>