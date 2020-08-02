
          this.fieldDisplayNames = {<%for (let field of theView) {%>
            '<%-field.fieldName%>': '<%-field.displayName%>',<%}%>
          };<%_
for (let field of theView) { let fn = field.fieldName;
        if (field.enumValues) {%>
          this.enums['<%-fn%>'] = [<%for (let ev of field.enumValues) {%>
            '<%-ev%>',<%}%>
          ];<%}}%><%_
for (let field of theView) { let fn = field.fieldName;
        if (field.type == "SchemaString") {%>
          this.stringFields.push('<%-fn%>');<%}}%><%_
let refObjects = [];
    for (let field of theView) { 
        if (field.type === "ObjectId"){ refObjects.push([field.fieldName, field.ref]);}
    }
    if (refObjects.length > 0) {%>
          this.referenceFields = [<%for (let itm of refObjects) {%>
            '<%-itm[0]%>',<%}%>
          ];<%}%><%_
let dateObjects = [];
    for (let field of theView) { 
        if (field.type === "SchemaDate") dateObjects.push(field.fieldName);
    }
    if (dateObjects.length > 0) {%>
          this.dateFields = [<%for (let fnm of dateObjects) {%>
            '<%-fnm%>',<%}%>
          ];<%}%><%_
let numberObjects = [];
    for (let field of theView) { 
        if (field.type === "SchemaNumber") numberObjects.push(field.fieldName);
    }
    if (numberObjects.length > 0) {%>
          this.numberFields = [<%for (let fnm of numberObjects) {%>
            '<%-fnm%>',<%}%>
          ];<%}%><%_
let mapFields = [];
    for (let field of theView) { 
        if (field.type === "Map") {
          let keyType, keyRefName, keyRefService, keyRefSubField;
          if (field.mapKeyInfo && isEditView) {
            keyType = field.mapKeyInfo.type;
            keyRefName = field.mapKeyInfo.refName;
            if (field.mapKeyInfo.type == 'ObjectId') {
              keyRefService = field.mapKeyInfo.refService;
              keyRefSubField = field.mapKeyInfo.refSubField;
            }
          }
          mapFields.push([field.fieldName, field.elementType, keyType, keyRefName, keyRefService, keyRefSubField]);
        }
    }
    if (mapFields.length > 0) {%>
          this.mapFields = [<%for (let f of mapFields) {%>
              ['<%-f[0]%>', '<%-f[1]%>', '<%-f[2]%>', '<%-f[3]%>', <%-f[4]%>, '<%-f[5]%>'],<%}%>
          ];<%}%><%_
let multiSelectionFields = [];
    for (let field of theView) { 
        if (field.type === "SchemaArray" && field.elementMultiSelect) multiSelectionFields.push(field.fieldName);
    }
    if (multiSelectionFields.length > 0) {%>
          this.multiSelectionFields = [<%for (let fnm of multiSelectionFields) {%>
            '<%-fnm%>', <%}%>
          ];<%}%><%_
let arrayFields = []; let arrayRefFields = [];
    for (let field of theView) {
        if (field.type === "SchemaArray" && !field.elementMultiSelect) {
          arrayFields.push([field.fieldName, field.elementType]);
          if (field.elementType == 'ObjectId') {
            arrayRefFields.push([field.fieldName, field.ref]);
          }
        }
    }
    if (arrayFields.length > 0) {%>
          this.arrayFields = [<%for (let f of arrayFields) {%>
            ['<%-f[0]%>', '<%-f[1]%>'],<%}%>
          ];<%}
    if (arrayRefFields.length > 0) { 
        for (let itm of arrayRefFields) {%>
          this.referenceFieldsMap['<%-itm[0]%>'] = '<%-itm[1]%>';
          this.referenceFieldsReverseMap['<%-itm[1]%>'] = '<%-itm[0]%>';<%}}%><%_
let viewHiddenFields = [];
    for (let field of theView) { 
        if (field.hidden) viewHiddenFields.push(field.fieldName);
    }
    if (viewHiddenFields.length > 0) {%>
          this.viewHiddenFields = [<%for (let fnm of viewHiddenFields) {%>
            '<%-fnm%>',<%}%>
          ];<%}%><%_
let textareaFields = [];
    for (let field of theView) { 
        if (field.textarea) textareaFields.push(field.fieldName);
    }
    if (textareaFields.length > 0) {%>
          this.textareaFields = [<%for (let fnm of textareaFields) {%>
            '<%-fnm%>',<%}%>
          ];<%}%><%_ 
let hintFields = [];
    for (let field of theView) {
        if (field.hint) {
          hintFields.push(field.fieldName);
        }
    }
    if (hintFields.length > 0) {%>
          this.editHintFields = {<%for (let itm of hintFields) {%>
            '<%-itm%>': [],<%}%>
          };<%}%><%_ 
if (ownSearchStringFields.length > 0) {%>
          this.ownSearchStringFields = [<%for (let itm of ownSearchStringFields) {%>
            '<%-itm%>',<%}%>
          ];<%}%>