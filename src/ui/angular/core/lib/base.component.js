"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var util_modal_1 = require("./util.modal");
var util_snackbar_1 = require("./util.snackbar");
var util_errortoast_1 = require("./util.errortoast");
var base_service_1 = require("./base.service");
exports.ServiceError = base_service_1.ServiceError;
var common_service_1 = require("./common.service");
var util_tools_1 = require("./util.tools");
var ViewType;
(function (ViewType) {
    ViewType[ViewType["LIST"] = 0] = "LIST";
    ViewType[ViewType["DETAIL"] = 1] = "DETAIL";
    ViewType[ViewType["EDIT"] = 2] = "EDIT";
})(ViewType = exports.ViewType || (exports.ViewType = {}));
var BaseComponent = /** @class */ (function () {
    function BaseComponent(service, injector, router, route, location, view, itemCamelName) {
        this.service = service;
        this.injector = injector;
        this.router = router;
        this.route = route;
        this.location = location;
        this.view = view;
        this.itemCamelName = itemCamelName;
        this.objectKeys = Object.keys;
        this.storage = {};
        //For list and pagination
        this.list = [];
        this.majorUi = true;
        this.eventEmitter = new core_1.EventEmitter();
        this.page = 1;
        this.per_page = 25;
        this.total_count = 0;
        this.total_pages = 0;
        this.pages = [];
        this.left_more = false;
        this.right_more = false;
        this.checkAll = false;
        //used to mark deleted items, or items that will show sub-detail, etc.
        this.checkedItem = [];
        //For edit and view details
        this.detail = {};
        this._detail = {}; //a clone and used to send/receive from next work
        this._extra = {}; //extra info.
        this.subEdit = false; //a edit-sub component
        //for fields with enum values
        this.enums = {};
        this.stringFields = [];
        this.referenceFields = [];
        this.referenceFieldsMap = {};
        this.dateFields = [];
        this.indexFields = [];
        this.multiSelectionFields = [];
        this.arrayFields = []; //element is [fieldName, elementType]
        this.mapFields = []; //element is [fieldName, elementType, mapKey]
        this.dateFormat = "MM/DD/YYYY";
        this.timeFormat = "hh:mm:ss";
        this.hiddenFields = []; //fields hide from view. Currrently used by "Add" view of edit-sub
        this.refreshing = false;
        this.clickedId = null;
        this.selectedId = null;
        this.moreSearchOpened = false;
        this.textEditorMap = {};
        /*** Any View - add new component in the current view*/
        this.isAdding = false;
        this.ItemCamelName = itemCamelName.charAt(0).toUpperCase() + itemCamelName.substr(1);
        this.itemName = itemCamelName.toLowerCase();
        this.parentItem = this.getParentRouteItem();
        this.commonService = injector.get(common_service_1.MraCommonService);
    }
    BaseComponent.prototype.onServiceError = function (error) {
        //clear any pending flags
        this.refreshing = false;
        var errMsg;
        var more;
        if (error.clientErrorMsg) {
            errMsg = error.clientErrorMsg;
        }
        else if (error.serverError) {
            if (error.status == 401)
                return; //Don't show unauthorized error
            if (typeof error.serverError === 'object') {
                errMsg = error.status + ": " + JSON.stringify(error.serverError);
            }
            else {
                errMsg = error.status + ": " + error.serverError;
            }
        }
        console.info("Error: " + errMsg);
        if (!errMsg)
            errMsg = "Unknown error.";
        if (errMsg.length > 80) {
            more = errMsg;
            errMsg = errMsg.substring(0, 80) + "...";
        }
        var errorToastConfig = {
            content: errMsg,
            more: more
        };
        var errorToast = new util_errortoast_1.ErrorToast(errorToastConfig);
        errorToast.show();
    };
    BaseComponent.prototype.populatePages = function () {
        this.pages = [];
        var SHOW_PAGE = 9;
        var HALF = (SHOW_PAGE - 1) / 2;
        var min, max;
        if (this.total_pages <= SHOW_PAGE) {
            min = 1;
            max = this.total_pages;
            this.left_more = false;
            this.right_more = false;
        }
        else {
            if (this.page - 1 < HALF) {
                min = 1;
                max = SHOW_PAGE - 1;
                this.left_more = false;
                this.right_more = true;
            }
            else if (this.total_pages - this.page < HALF) {
                max = this.total_pages;
                min = (this.total_pages - SHOW_PAGE + 1) + 1;
                this.left_more = true;
                this.right_more = false;
            }
            else {
                min = this.page - HALF + 1;
                max = this.page + HALF - 1;
                this.left_more = true;
                this.right_more = true;
            }
        }
        for (var i = min; i <= max; i++) {
            this.pages.push(i);
        }
    };
    BaseComponent.prototype.getKey = function (key) {
        var url = this.router.url.split(';')[0].split('?')[0];
        return url + ":" + key;
    };
    BaseComponent.prototype.putToStorage = function (key, value) {
        if (this.majorUi) {
            //only major UI we want to cache and recover when user comes back
            this.commonService.putToStorage(this.getKey(key), value);
        }
        else {
            this.storage[key] = value;
        }
    };
    BaseComponent.prototype.getFromStorage = function (key) {
        if (this.majorUi) {
            return this.commonService.getFromStorage(this.getKey(key));
        }
        else {
            return this.storage[key];
        }
    };
    BaseComponent.prototype.routeToPage = function (page) {
        this.putToStorage("page", page);
        this.populateList();
    };
    BaseComponent.prototype.onNextPage = function () {
        if (this.page >= this.total_pages)
            return;
        this.routeToPage(this.page + 1);
    };
    BaseComponent.prototype.onPreviousPage = function () {
        if (this.page <= 1)
            return;
        this.routeToPage(this.page - 1);
    };
    BaseComponent.prototype.onGotoPage = function (p) {
        if (p > this.total_pages || p < 1)
            return;
        this.routeToPage(p);
    };
    BaseComponent.prototype.goBack = function () {
        this.location.back();
        /*
        // window.history.back();
        if (this.view != ViewType.EDIT)
            this.location.back();
        else {
            let url = this.location.path(); //in EDIT view, the current url is skipped. So get the "previous" one from path.
            this.router.navigateByUrl(url);
        }
        */
    };
    BaseComponent.prototype.stringify = function (detail) {
        var str = "";
        for (var _i = 0, _a = this.indexFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            if (detail[fnm] && typeof detail[fnm] != 'object')
                str += " " + detail[fnm];
        }
        if (!str) {
            for (var prop in detail) {
                if (prop !== '_id' && detail[prop] && typeof detail[prop] != 'object') {
                    str += " " + detail[prop];
                }
            }
        }
        if (!str)
            str = detail["_id"] ? detail["_id"] : "...";
        str = str.replace(/^\s+|\s+$/g, '');
        if (str.length > 30)
            str = str.substr(0, 27) + '...';
        return str;
    };
    /***Start: handle reference fields***/
    BaseComponent.prototype.formatReferenceField = function (field, fieldName) {
        var id, value;
        if (typeof field == 'string') {
            //assume this is the "_id", let see we have the cached details for this ref from service
            var refDetail = this.commonService.getFromStorage(field);
            if (refDetail && (typeof refDetail == 'object'))
                field = refDetail;
            else {
                id = field;
                field = { '_id': id };
            }
        }
        else if (field && (typeof field == 'object')) {
            id = field['_id'];
            var referIndex = '';
            for (var k in field) {
                if (k != '_id')
                    referIndex += " " + field[k];
            }
            referIndex = referIndex.replace(/^\s+|\s+$/g, '');
            if (referIndex.length >= 20)
                referIndex = referIndex.substring(0, 20) + "...";
            field = { '_id': id, 'value': referIndex ? referIndex : fieldName };
        }
        else { //not defined
            field = { '_id': id, 'value': value };
        }
        return field;
    };
    BaseComponent.prototype.formatReference = function (detail) {
        for (var _i = 0, _a = this.referenceFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            detail[fnm] = this.formatReferenceField(detail[fnm], fnm);
        }
        return detail;
    };
    BaseComponent.prototype.deFormatReference = function (detail) {
        for (var _i = 0, _a = this.referenceFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            if (typeof detail[fnm] !== 'object') { //not defined
                //let date values undefined
                delete detail[fnm];
            }
            else {
                var id = detail[fnm]['_id'];
                if (typeof id !== 'string')
                    delete detail[fnm];
                else
                    detail[fnm] = id;
            }
        }
        return detail;
    };
    BaseComponent.prototype.clearFieldReference = function (field) {
        for (var prop in field) {
            field[prop] = undefined;
        }
        return field;
    };
    BaseComponent.prototype.isDefinedFieldReference = function (field) {
        if ('_id' in field && typeof field['_id'] == 'string')
            return true;
        return false;
    };
    /***Start: handle date fields***/
    BaseComponent.prototype.formatDateField = function (field) {
        var fmt = this.dateFormat;
        var t_fmt = this.timeFormat;
        var d, M, yyyy, h, m, s;
        var dt = new Date(field);
        var dd, MM, hh, mm, ss;
        d = dt.getDate();
        M = dt.getMonth() + 1;
        yyyy = dt.getFullYear();
        var yy = yyyy.toString().slice(2);
        h = dt.getHours();
        m = dt.getMinutes();
        s = dt.getSeconds();
        dd = d < 10 ? '0' + d : d.toString();
        MM = M < 10 ? '0' + M : M.toString();
        hh = h < 10 ? '0' + h : h.toString();
        mm = m < 10 ? '0' + m : m.toString();
        ss = s < 10 ? '0' + s : s.toString();
        var value = fmt.replace(/yyyy/ig, yyyy.toString()).
            replace(/yy/ig, yy.toString()).
            replace(/MM/g, MM.toString()).
            replace(/dd/ig, dd.toString());
        var t_value = t_fmt.replace(/hh/ig, hh.toString()).
            replace(/mm/g, mm.toString()).
            replace(/ss/ig, ss.toString());
        /*Datepicker uses NgbDateStruct as a model and not the native Date object.
        It's a simple data structure with 3 fields. Also note that months start with 1 (as in ISO 8601).
        
        we add h, m, s here
        */
        //"from" and "to" used for search context. pop: show the selection popup
        return { 'date': { day: d, month: M, year: yyyy }, 'value': value, 'from': undefined, 'to': undefined, 'pop': false,
            'time': { hour: h, minute: m, second: s }, 't_value': value, 't_from': undefined, 't_to': undefined, 't_pop': false };
    };
    BaseComponent.prototype.formatDate = function (detail) {
        for (var _i = 0, _a = this.dateFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            var value = void 0, date = void 0;
            if (typeof detail[fnm] !== 'string') { //not defined
                //important: let date values undefined. "from" and "to" used for search context. pop: show the selection popup
                detail[fnm] = { 'date': undefined, 'value': undefined, 'from': undefined, 'to': undefined, 'pop': false };
            }
            else {
                detail[fnm] = this.formatDateField(detail[fnm]);
            }
        }
        return detail;
    };
    BaseComponent.prototype.deFormatDateField = function (date) {
        var d, M, yyyy, h, m, s;
        yyyy = date.year;
        M = date.month - 1;
        d = date.day;
        if (typeof yyyy !== 'number' || typeof M !== 'number' || typeof d !== 'number')
            return null;
        else {
            var dt = new Date(yyyy, M, d, 0, 0, 0, 0);
            return dt.toISOString();
        }
    };
    BaseComponent.prototype.deFormatDate = function (detail) {
        for (var _i = 0, _a = this.dateFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            var value = void 0;
            if (typeof detail[fnm] !== 'object') { //not defined
                //let date values undefined
                delete detail[fnm];
            }
            else {
                if (!detail[fnm].date)
                    delete detail[fnm];
                else {
                    var dateStr = this.deFormatDateField(detail[fnm].date);
                    if (!dateStr)
                        delete detail[fnm];
                    else
                        detail[fnm] = dateStr;
                }
            }
        }
        return detail;
    };
    BaseComponent.prototype.clearFieldDate = function (field) {
        for (var prop in field) {
            field[prop] = undefined;
        }
        return field;
    };
    BaseComponent.prototype.isDefinedFieldDate = function (field) {
        if (typeof field === 'object') {
            if (typeof field['date'] == 'object')
                return true;
            if (typeof field['from'] == 'object')
                return true;
            if (typeof field['to'] == 'object')
                return true;
        }
        return false;
    };
    /***Start: handle array of multi-selection fields***/
    BaseComponent.prototype.formatArrayMultiSelectionField = function (field, enums) {
        var selectObj = {};
        var value = "";
        for (var _i = 0, enums_1 = enums; _i < enums_1.length; _i++) {
            var e = enums_1[_i];
            selectObj[e] = false; //not exist
        }
        if (Array.isArray(field)) { //not defined
            for (var _a = 0, field_1 = field; _a < field_1.length; _a++) {
                var e = field_1[_a];
                selectObj[e] = true; //exist.
            }
            value = field.join(" | ");
        }
        return { 'selection': selectObj, value: value };
    };
    BaseComponent.prototype.formatArrayMultiSelection = function (detail) {
        for (var _i = 0, _a = this.multiSelectionFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            detail[fnm] = this.formatArrayMultiSelectionField(detail[fnm], this.enums[fnm]);
        }
        return detail;
    };
    BaseComponent.prototype.deFormatArrayMultiSelection = function (detail) {
        for (var _i = 0, _a = this.multiSelectionFields; _i < _a.length; _i++) {
            var fnm = _a[_i];
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (!detail[fnm].selection)
                    delete detail[fnm];
                else {
                    var selectArray = [];
                    for (var _b = 0, _c = this.enums[fnm]; _b < _c.length; _b++) {
                        var e = _c[_b];
                        if (detail[fnm].selection[e])
                            selectArray.push(e);
                    }
                    if (selectArray.length > 0)
                        detail[fnm] = selectArray;
                    else
                        delete detail[fnm];
                }
            }
        }
        return detail;
    };
    BaseComponent.prototype.clearFieldArrayMultiSelection = function (field) {
        if (!field['selection'])
            return field;
        for (var prop in field['selection']) {
            field['selection'][prop] = false; //not exist
        }
        return field;
    };
    BaseComponent.prototype.isDefinedFieldArrayMultiSelection = function (field) {
        if ('selection' in field && typeof field['selection'] == 'object') {
            var keys = Object.keys(field['selection']);
            return keys.some(function (e) { return field['selection'][e]; });
        }
        return false;
    };
    BaseComponent.prototype.multiselectionSelected = function (fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldArrayMultiSelection(this.detail[fieldName]);
    };
    /***End: handle array of multi-selection fields***/
    /***Start: handle map fields***/
    BaseComponent.prototype.formatMapField = function (field, elementType) {
        var selectObj = {};
        var values = [];
        if (typeof field == 'object') {
            selectObj = field;
            for (var e in field) {
                if (elementType === 'SchemaString') {
                    values.push(e + "(" + field[e] + ")");
                }
            }
        }
        values = values.filter(function (x) { return !!x; });
        var value = values.join(" | ");
        return { 'selection': selectObj, value: value, keys: [] };
    };
    BaseComponent.prototype.formatMapFields = function (detail) {
        for (var _i = 0, _a = this.mapFields; _i < _a.length; _i++) {
            var f = _a[_i];
            //[fieldName, elementType]
            detail[f[0]] = this.formatMapField(detail[f[0]], f[1]);
        }
        return detail;
    };
    BaseComponent.prototype.deFormatMapFields = function (detail) {
        for (var _i = 0, _a = this.mapFields; _i < _a.length; _i++) {
            var f = _a[_i];
            //[fieldName, elementType]
            var fnm = f[0];
            var elementType = f[1];
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (!detail[fnm].selection)
                    delete detail[fnm];
                else {
                    var selectMap = detail[fnm].selection;
                    for (var e in detail[fnm].selection) {
                        if (elementType === 'SchemaString') {
                            ;
                        }
                    }
                    if (Object.keys(selectMap).length > 0)
                        detail[fnm] = selectMap;
                    else
                        delete detail[fnm];
                }
            }
        }
        return detail;
    };
    BaseComponent.prototype.clearFieldMap = function (field) {
        if (!field['selection'])
            return field;
        field['selection'] = {};
        field.value = undefined;
        return field;
    };
    BaseComponent.prototype.isDefinedFieldMap = function (field) {
        if ('selection' in field && typeof field['selection'] == 'object') {
            return Object.keys(field['selection']).length > 0;
        }
        return false;
    };
    BaseComponent.prototype.mapSelected = function (fieldName) {
        if (!this.detail[fieldName] || typeof this.detail[fieldName]['selection'] != 'object') {
            return false;
        }
        return this.isDefinedFieldMap(this.detail[fieldName]);
    };
    /***End: handle map fields***/
    /***Start: handle array fields***/
    BaseComponent.prototype.formatArrayField = function (field, elementType) {
        var selectArray = [];
        var values = [];
        if (Array.isArray(field)) { //not defined
            for (var _i = 0, field_2 = field; _i < field_2.length; _i++) {
                var e = field_2[_i];
                if (elementType === 'ObjectId') {
                    var ref = this.formatReferenceField(e, "...");
                    selectArray.push(ref);
                    values.push(ref.value);
                }
                else if (elementType === 'SchemaString') {
                    selectArray.push(e);
                    values.push(e);
                }
            }
        }
        values = values.filter(function (x) { return !!x; });
        var value = values.join(" | ");
        return { 'selection': selectArray, value: value };
    };
    BaseComponent.prototype.formatArrayFields = function (detail) {
        for (var _i = 0, _a = this.arrayFields; _i < _a.length; _i++) {
            var f = _a[_i];
            //[fieldName, elementType]
            detail[f[0]] = this.formatArrayField(detail[f[0]], f[1]);
        }
        return detail;
    };
    BaseComponent.prototype.deFormatArrayFields = function (detail) {
        for (var _i = 0, _a = this.arrayFields; _i < _a.length; _i++) {
            var f = _a[_i];
            //[fieldName, elementType]
            var fnm = f[0];
            var elementType = f[1];
            if (typeof detail[fnm] !== 'object') { //not defined
                delete detail[fnm];
            }
            else {
                if (!detail[fnm].selection)
                    delete detail[fnm];
                else {
                    var selectArray = [];
                    for (var _b = 0, _c = detail[fnm].selection; _b < _c.length; _b++) {
                        var e = _c[_b];
                        if (elementType === 'ObjectId') {
                            if (e && e['_id'] && typeof e['_id'] === 'string')
                                selectArray.push(e['_id']);
                        }
                        else if (elementType === 'SchemaString') {
                            if (e)
                                selectArray.push(e);
                        }
                    }
                    if (selectArray.length > 0)
                        detail[fnm] = selectArray;
                    else
                        delete detail[fnm];
                }
            }
        }
        return detail;
    };
    BaseComponent.prototype.clearFieldArray = function (field) {
        if (!field['selection'])
            return field;
        field['selection'] = [];
        field.value = undefined;
        return field;
    };
    BaseComponent.prototype.isDefinedFieldArray = function (field) {
        if ('selection' in field && Array.isArray(field['selection'])) {
            return field['selection'].length > 0;
        }
        return false;
    };
    BaseComponent.prototype.arraySelected = function (fieldName) {
        if (!this.detail[fieldName] || !Array.isArray(this.detail[fieldName]['selection'])) {
            return false;
        }
        return this.isDefinedFieldArray(this.detail[fieldName]);
    };
    /***End: handle array fields***/
    BaseComponent.prototype.formatDetail = function (detail) {
        detail = this.formatReference(detail);
        detail = this.formatDate(detail);
        detail = this.formatArrayMultiSelection(detail);
        detail = this.formatArrayFields(detail);
        detail = this.formatMapFields(detail);
        return detail;
    };
    BaseComponent.prototype.deFormatDetail = function (detail) {
        var cpy = util_tools_1.Util.clone(detail);
        cpy = this.deFormatReference(cpy);
        cpy = this.deFormatDate(cpy);
        cpy = this.deFormatArrayMultiSelection(cpy);
        cpy = this.deFormatArrayFields(cpy);
        cpy = this.deFormatMapFields(cpy);
        return cpy;
    };
    BaseComponent.prototype.populateDetail = function (id) {
        return this.populateDetailForAction(id, null);
    };
    BaseComponent.prototype.populateDetailForAction = function (id, action) {
        var _this = this;
        //action: eg: action=edit  -> get detail for editing purpose 
        this.service.getDetailForAction(id, action).subscribe(function (detail) {
            var originalDetail = util_tools_1.Util.clone(detail);
            if (detail["_id"])
                _this.commonService.putToStorage(detail["_id"], originalDetail); //cache it
            _this.detail = _this.formatDetail(detail);
            _this.extraFieldsUnload(); //unload data to text editors, etc
            if (action == 'edit') {
                _this.extraInfoPopulate(); //collect other info required for edit view
            }
            if (_this.refreshing) {
                _this.refreshing = false;
                var snackBarConfig = {
                    content: "Detail refreshed"
                };
                var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                snackBar.show();
            }
            _this.eventEmitter.emit(_this.detail);
        }, this.onServiceError);
        return this.eventEmitter;
    };
    BaseComponent.prototype.populateDetailFromCopy = function (copy_id) {
        var _this = this;
        this.service.getDetail(copy_id).subscribe(function (detail) {
            _this.detail = _this.formatDetail(detail);
            delete _this.detail["_id"];
            _this.extraFieldsUnload(); //unload data to text editors, etc
            _this.extraInfoPopulate(); //collect other info required for create view
        }, this.onServiceError);
    };
    BaseComponent.prototype.extraInfoPopulate = function () {
        var _loop_1 = function (fieldDef) {
            //fieldDef: [field.fieldName, field.elementType, keyType, keyRefName, keyRefService, keyRefSubField]
            var fieldName = fieldDef[0]; //this.<keyRefName>.<keyRefSubField>
            var mapKeyType = fieldDef[2]; //this.<keyRefName>.<keyRefSubField>
            var keyArray = [];
            if (mapKeyType == "ObjectId") {
                var keyRefName = fieldDef[3];
                var recordKey_1 = 'key-id-' + keyRefName;
                var refService = this_1.injector.get(fieldDef[4]);
                var id_1 = this_1.detail[keyRefName] ? this_1.detail[keyRefName]['_id'] : undefined;
                if (!id_1)
                    return "continue";
                var mapField_1 = this_1.detail[fieldName];
                if (mapField_1[recordKey_1] == id_1)
                    return "continue"; //already populated for the same id
                refService.getDetail(id_1).subscribe(function (detail) {
                    if (Array.isArray(detail[fieldDef[5]])) {
                        keyArray = detail[fieldDef[5]];
                        mapField_1['keys'] = keyArray;
                        mapField_1[recordKey_1] = id_1; //record that keys is populated from this object
                        if (mapField_1['selection']) {
                            for (var _i = 0, keyArray_1 = keyArray; _i < keyArray_1.length; _i++) {
                                var k = keyArray_1[_i];
                                if (!(k in mapField_1['selection']))
                                    mapField_1['selection'][k] = "";
                            }
                        }
                    }
                }, this_1.onServiceError);
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = this.mapFields; _i < _a.length; _i++) {
            var fieldDef = _a[_i];
            _loop_1(fieldDef);
        }
    };
    BaseComponent.prototype.equalTwoSearchContextArrays = function (arr1, arr2) {
        if (!arr1)
            arr1 = [];
        if (!arr2)
            arr2 = [];
        if (arr1.length == 0 && arr2.length == 0)
            return true;
        //all object in array has format of {'field': 'value'} format
        function compareObj(a, b) {
            var a_s = JSON.stringify(a), b_s = JSON.stringify(b);
            if (a_s < b_s)
                return -1;
            if (a_s > b_s)
                return 1;
            return 0;
        }
        arr1 = arr1.sort(compareObj);
        arr2 = arr2.sort(compareObj);
        if (JSON.stringify(arr1) == JSON.stringify(arr2))
            return true;
        return false;
    };
    BaseComponent.prototype.processSearchContext = function () {
        this.moreSearchOpened = false;
        var d = this.detail;
        for (var _i = 0, _a = this.stringFields; _i < _a.length; _i++) {
            var s = _a[_i];
            d[s] = this.searchText;
        }
        var orSearchContext = [], andSearchContext = [];
        for (var field in d) {
            if (typeof d[field] == 'string') {
                var o = {};
                o[field] = d[field];
                orSearchContext.push(o);
            }
        }
        this.searchMoreDetail = [];
        var d2 = this.deFormatDetail(d); //undefined field is deleted after this step
        var _loop_2 = function (field) {
            if (this_2.stringFields.indexOf(field) == -1) { //string fields already put to orSearchContext
                var o = {};
                var valueToShow = void 0;
                o[field] = d2[field];
                if (this_2.multiSelectionFields.includes(field)) {
                    o[field] = { $in: d2[field] }; //use $in for or, and $all for and
                    var t = this_2.formatArrayMultiSelectionField(d2[field], this_2.enums[field]);
                    valueToShow = t.value;
                }
                else if (this_2.arrayFields.some(function (x) { return x[0] == field; })) {
                    o[field] = { $in: d2[field] }; //use $in for or, and $all for and
                    valueToShow = d[field]['value'];
                }
                else if (this_2.dateFields.includes(field)) {
                    var t = this_2.formatDateField(d2[field]);
                    valueToShow = t.value;
                }
                else if (this_2.referenceFields.includes(field)) {
                    valueToShow = valueToShow = d[field]['value'];
                }
                else {
                    valueToShow = d[field]; //take directoy from what we get 
                }
                this_2.searchMoreDetail.push([field, valueToShow]);
                andSearchContext.push(o);
            }
        };
        var this_2 = this;
        for (var field in d2) {
            _loop_2(field);
        }
        //Handle date range selection. These fields are not in d2, because field.date is undefined.
        for (var _b = 0, _c = this.dateFields; _b < _c.length; _b++) {
            var prop = _c[_b];
            var o = {};
            var valueToShow = "";
            o[prop] = {};
            if (typeof d[prop] !== 'object') { //not defined
                continue;
            }
            if (!d[prop]['from'] && !d[prop]['to']) { //not range
                continue;
            }
            if (d[prop]['from']) {
                o[prop]['from'] = this.deFormatDateField(d[prop]['from']);
                valueToShow += this.formatDateField(o[prop]['from']).value;
            }
            valueToShow += " ~ ";
            if (d[prop]['to']) {
                o[prop]['to'] = this.deFormatDateField(d[prop]['to']);
                valueToShow += this.formatDateField(o[prop]['to']).value;
            }
            this.searchMoreDetail.push([prop, valueToShow]);
            andSearchContext.push(o);
        }
        var searchContext = { '$and': [{ '$or': orSearchContext }, { '$and': andSearchContext }] };
        /* searchContext ={'$and', [{'$or', []},{'$and', []}]}
        */
        var context = this.getFromStorage("searchContext");
        if (context && context["$and"]) {
            var cachedOr = void 0, cachedAnd = void 0;
            for (var _d = 0, _e = context["$and"]; _d < _e.length; _d++) {
                var sub = _e[_d];
                if ('$and' in sub)
                    cachedAnd = sub['$and'];
                else if ('$or' in sub)
                    cachedOr = sub['$or'];
            }
            if (this.equalTwoSearchContextArrays(cachedOr, orSearchContext)
                && this.equalTwoSearchContextArrays(cachedAnd, andSearchContext)) {
                return;
            }
        }
        if (orSearchContext.length == 0 && andSearchContext.length == 0)
            searchContext = null;
        this.putToStorage("searchContext", searchContext);
        this.putToStorage("searchText", this.searchText);
        this.putToStorage("page", 1); //start from 1st page
        this.putToStorage("searchMoreDetail", this.searchMoreDetail);
        this.putToStorage("detail", this.detail);
    };
    BaseComponent.prototype.searchList = function () {
        this.processSearchContext();
        //update the URL
        this.router.navigate(['.', {}], { relativeTo: this.route }); //start from 1st page
        this.putToStorage("page", 1); //start from 1st page
        this.populateList();
    };
    BaseComponent.prototype.loadUIFromCache = function () {
        //Now let's reload the search condition to UI
        this.searchText = this.getFromStorage("searchText");
        this.searchMoreDetail = this.getFromStorage("searchMoreDetail");
        var detail = this.getFromStorage("detail");
        if (detail)
            this.detail = detail;
    };
    BaseComponent.prototype.populateList = function () {
        var _this = this;
        //First let's handle page
        var new_page;
        var searchContext, searchText;
        var url_page = parseInt(this.route.snapshot.paramMap.get('page'));
        var cached_page = parseInt(this.getFromStorage("page"));
        if (cached_page) {
            new_page = cached_page;
            if (cached_page == 1)
                this.router.navigate(['.', {}], { relativeTo: this.route, }); //update the url
            else
                this.router.navigate(['.', { page: cached_page }], { relativeTo: this.route, }); //update the url
        }
        else if (url_page)
            new_page = url_page;
        else
            new_page = 1;
        searchContext = this.getFromStorage("searchContext");
        this.loadUIFromCache();
        this.service.getList(new_page, this.per_page, searchContext).subscribe(function (result) {
            _this.list = result.items.map(function (x) { return _this.formatDetail(x); });
            _this.page = result.page;
            _this.per_page = result.per_page;
            _this.total_count = result.total_count;
            _this.total_pages = result.total_pages;
            _this.populatePages();
            _this.checkedItem =
                Array.apply(null, Array(_this.list.length)).map(Boolean.prototype.valueOf, false);
            _this.checkAll = false;
            if (_this.refreshing) {
                _this.refreshing = false;
                var snackBarConfig = {
                    content: "List refreshed"
                };
                var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                snackBar.show();
            }
            _this.eventEmitter.emit(_this.list);
        }, this.onServiceError);
        return this.eventEmitter;
    };
    /*UI operations handlers*/
    BaseComponent.prototype.onRefresh = function () {
        if (this.view == ViewType.LIST) {
            this.refreshing = true;
            this.populateList();
        }
        else if (this.view == ViewType.DETAIL) {
            this.refreshing = true;
            if (!this.id)
                this.id = this.route.snapshot.paramMap.get('id');
            if (this.id)
                this.populateDetail(this.id);
            else
                console.error("Routing error for detail view... no id...");
        }
    };
    BaseComponent.prototype.onCheckAllChange = function () {
        this.checkedItem =
            Array.apply(null, Array(this.list.length)).
                map(Boolean.prototype.valueOf, this.checkAll);
    };
    BaseComponent.prototype.isItemSelected = function () {
        return this.checkedItem.some(function (value) { return value; });
    };
    BaseComponent.prototype.onDeleteSelected = function () {
        var _this = this;
        var deletedItem = [];
        this.checkedItem.forEach(function (value, index) {
            if (value) {
                deletedItem.push(_this.list[index]["_id"]);
            }
        });
        var modalConfig = {
            title: "Delete Confirmation",
            content: "Are you sure you want to delete selected items from the system?",
            //list of button text
            buttons: ['Delete', 'Cancel'],
            //list of button returns when clicked
            returns: [true, false],
            callBack: function (result) {
                if (result) {
                    _this.service.deleteManyByIds(deletedItem).subscribe(function (result) {
                        var snackBarConfig = {
                            content: _this.ItemCamelName + " deleted"
                        };
                        var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                        snackBar.show();
                        if (_this.view != ViewType.LIST)
                            _this.router.navigate(['../../list'], { relativeTo: _this.route });
                        else {
                            var len = _this.checkedItem.length;
                            for (var i = 0; i < len; i++) {
                                var idx = len - 1 - i;
                                var value = _this.checkedItem[idx];
                                if (value) {
                                    _this.list.splice(idx, 1);
                                    _this.checkedItem.splice(idx, 1);
                                    _this.total_count -= 1;
                                }
                            }
                            ;
                        }
                    }, _this.onServiceError);
                }
            }
        };
        var modal = new util_modal_1.Modal(modalConfig);
        modal.show();
    };
    BaseComponent.prototype.onDelete = function (id, idx) {
        var _this = this;
        var modalConfig = {
            title: "Delete Confirmation",
            content: "Are you sure you want to delete this " + this.itemCamelName + " from the system?",
            //list of button text
            buttons: ['Delete', 'Cancel'],
            //list of button returns when clicked
            returns: [true, false],
            callBack: function (result) {
                if (result) {
                    _this.service.deleteOne(id).subscribe(function (result) {
                        var snackBarConfig = {
                            content: _this.ItemCamelName + " deleted"
                        };
                        var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                        snackBar.show();
                        if (_this.view != ViewType.LIST)
                            _this.router.navigate(['../../list'], { relativeTo: _this.route });
                        else if (idx != null && _this.list) {
                            _this.list.splice(idx, 1);
                            _this.checkedItem.splice(idx, 1);
                            _this.total_count -= 1;
                        }
                    }, _this.onServiceError);
                }
            }
        };
        var modal = new util_modal_1.Modal(modalConfig);
        modal.show();
    };
    BaseComponent.prototype.onSubmit = function () {
        var _this = this;
        if (!this.extraFieldsLoad())
            return; //error from other non ngModel fields;
        this._detail = this.deFormatDetail(this.detail);
        if (this.id) {
            this.service.updateOne(this.id, this._detail).subscribe(function (result) {
                var snackBarConfig = {
                    content: _this.ItemCamelName + " updated."
                };
                var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                snackBar.show();
                _this.router.navigate(['../../detail', _this.id], { relativeTo: _this.route });
            }, this.onServiceError);
        }
        else {
            this.service.createOne(this._detail).subscribe(function (result) {
                var action = _this.subEdit ? " added" : " created.";
                var snackBarConfig = {
                    content: _this.ItemCamelName + action
                };
                var snackBar = new util_snackbar_1.SnackBar(snackBarConfig);
                snackBar.show();
                _this.id = result["_id"];
                _this._detail = result;
                if (_this.subEdit) {
                    _this.done.emit(true);
                }
                else {
                    _this.router.navigate(['../detail', _this.id], { relativeTo: _this.route });
                }
            }, this.onServiceError);
        }
    };
    BaseComponent.prototype.editCancel = function () {
        if (this.subEdit) {
            this.done.emit(false);
        }
        else {
            this.goBack();
        }
    };
    BaseComponent.prototype.onDisplayRefClicked = function (fn, detail, event) {
        var ref = this.getRefFromField(fn);
        var d = detail;
        if (d && d['_id']) {
            if (this.list) {
                for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
                    var item = _a[_i];
                    if (item[fn] == d)
                        this.clickedId = item['_id'];
                }
            }
            this.router.navigate([ref, 'detail', d['_id']], { relativeTo: this.getParentActivatedRouter() });
        }
        if (event)
            event.stopPropagation();
    };
    BaseComponent.prototype.onDetailLinkClicked = function (id) {
        this.clickedId = id;
        this.router.navigate([this.itemName, 'detail', id], { relativeTo: this.getParentActivatedRouter() });
    };
    BaseComponent.prototype.getRefFromField = function (fn) {
        return this.referenceFieldsMap[fn];
    };
    BaseComponent.prototype.clearValueFromDetail = function (field) {
        if (!this.detail.hasOwnProperty(field))
            return;
        if (typeof this.detail[field] == 'undefined')
            return;
        if (typeof this.detail[field] == 'object') { //reference field or date
            if (this.multiSelectionFields.includes(field)) {
                this.detail[field] = this.clearFieldArrayMultiSelection(this.detail[field]);
            }
            else if (this.arrayFields.some(function (x) { return x[0] == field; })) {
                this.detail[field] = this.clearFieldArray(this.detail[field]);
            }
            else if (this.mapFields.some(function (x) { return x[0] == field; })) {
                this.detail[field] = this.clearFieldMap(this.detail[field]);
            }
            else if (this.dateFields.includes(field)) {
                this.detail[field] = this.clearFieldDate(this.detail[field]);
            }
            else if (this.referenceFields.includes(field)) {
                this.detail[field] = this.clearFieldReference(this.detail[field]);
            }
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
        else {
            delete this.detail[field];
        }
    };
    BaseComponent.prototype.clearValueFromArrayField = function (field, idx) {
        if (this.detail[field]['selection']) {
            this.detail[field]['selection'] = this.detail[field]['selection'].filter(function (x, i) { return i != idx; });
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    };
    BaseComponent.prototype.clearValueFromMapField = function (field, key) {
        if (this.detail[field]['selection']) {
            delete this.detail[field]['selection'][key];
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    };
    BaseComponent.prototype.clearValueFromMapKey = function (field, key) {
        if (this.detail[field]['selection']) {
            this.detail[field]['selection'][key] = undefined;
            //check if any info needs to change after clear certain values;
            this.extraInfoPopulate();
        }
    };
    BaseComponent.prototype.checkValueDefinedFromDetail = function (field) {
        var d = this.detail;
        if (!d.hasOwnProperty(field))
            return false;
        if (typeof d[field] == 'undefined')
            return false;
        if (typeof this.detail[field] == 'number'
            || typeof d[field] == 'string'
            || typeof d[field] == 'boolean')
            return true;
        if (typeof d[field] == 'object') {
            if (this.multiSelectionFields.includes(field)) {
                return this.isDefinedFieldArrayMultiSelection(d[field]);
            }
            else if (this.arrayFields.some(function (x) { return x[0] == field; })) {
                return this.isDefinedFieldArray(d[field]);
            }
            else if (this.mapFields.some(function (x) { return x[0] == field; })) {
                return this.isDefinedFieldMap(d[field]);
            }
            else if (this.dateFields.includes(field)) {
                return this.isDefinedFieldDate(d[field]);
            }
            else if (this.referenceFields.includes(field)) {
                return this.isDefinedFieldReference(d[field]);
            }
        }
        return false;
    };
    BaseComponent.prototype.clearValueFromDetailAndSearchList = function (field) {
        this.clearValueFromDetail(field);
        this.searchList();
    };
    BaseComponent.prototype.onAddArrayItem = function (fieldName) {
        if (this.arrayFields.some(function (x) { return x[0] == fieldName; })) {
            if (this.detail[fieldName]['new']) { //where new added item is stored
                var item = this.detail[fieldName]['new'];
                this.detail[fieldName]['new'] = undefined; //clear it
                this.detail[fieldName]['selection'].push(item);
                var values = [];
                if (this.detail[fieldName]['value'])
                    values = this.detail[fieldName]['value'].split(' | ');
                values.push(item); //display value
                values = values.filter(function (x) { return !!x; });
                this.detail[fieldName]['value'] = values.join(' | ');
                //see if related info needs to change after the change of this value
                this.extraInfoPopulate();
            }
        }
    };
    BaseComponent.prototype.onAddMapItem = function (fieldName) {
        if (this.mapFields.some(function (x) { return x[0] == fieldName; })) {
            if (this.detail[fieldName]['new']) { //where new added item is stored
                var item = this.detail[fieldName]['new'];
                this.detail[fieldName]['new'] = undefined; //clear it
                this.detail[fieldName]['selection'][item] = undefined; //move to selection object
                //TODO: this.detail[fieldName]['value'] change
                //see if related info needs to change after the change of this value
                this.extraInfoPopulate();
            }
        }
    };
    BaseComponent.prototype.onRefSelect = function (fieldName) {
        var _this = this;
        if (!this.refSelectDirective) {
            console.warn("No reference directive for field: ", fieldName);
            return;
        }
        var viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        if (!this.selectComponents[fieldName]) {
            console.warn("No reference defined for field: ", fieldName);
            return;
        }
        var componentRef = this.selectComponents[fieldName]["componentRef"];
        if (!componentRef) {
            var comType = this.selectComponents[fieldName]["select-type"];
            if (!comType)
                console.warn("No component type found for reference field ", fieldName);
            var componentFactory = this.componentFactoryResolver.resolveComponentFactory(comType);
            componentRef = viewContainerRef.createComponent(componentFactory); //create and insert in one call
            this.selectComponents[fieldName]["componentRef"] = componentRef; //save it
        }
        else {
            viewContainerRef.insert(componentRef.hostView);
        }
        var componentInstance = componentRef.instance;
        if (this.detail[fieldName]) {
            if (this.referenceFields.includes(fieldName)) {
                componentInstance.inputData = this.detail[fieldName]['_id'];
            }
        }
        componentInstance.setFocus();
        this.componentSubscription = componentInstance.done.subscribe(function (val) {
            if (val) {
                _this.componentSubscription.unsubscribe();
                viewContainerRef.detach(); //only detach. not destroy
            }
            var outputData = componentInstance.outputData;
            if (outputData) {
                switch (outputData.action) {
                    case "selected":
                        if (_this.arrayFields.some(function (x) { return x[0] == fieldName; })) {
                            _this.detail[fieldName]['selection'].push(outputData.value);
                            var values = [];
                            if (_this.detail[fieldName]['value'])
                                values = _this.detail[fieldName]['value'].split(' | ');
                            values.push(outputData.value.value); //display value
                            values = values.filter(function (x) { return !!x; });
                            _this.detail[fieldName]['value'] = values.join(' | ');
                        }
                        else if (_this.referenceFields.includes(fieldName)) {
                            _this.detail[fieldName] = outputData.value;
                        }
                        //trigger extraInfo populate, once reference changed.
                        _this.extraInfoPopulate();
                        break;
                    case "view":
                        _this.onRefShow(fieldName, "select", outputData.value); //value is _id
                        break;
                    default:
                        break;
                }
            }
        });
    };
    BaseComponent.prototype.onRefShow = function (fieldName, action, id) {
        var _this = this;
        if (!id && this.detail[fieldName])
            id = this.detail[fieldName]['_id'];
        if (!id) {
            console.error('Show reference but no id is given.');
            return;
        }
        var viewContainerRef = this.refSelectDirective.viewContainerRef;
        viewContainerRef.clear();
        var detailType = action + "-detail-type"; //eg: select-detail-type, pop-detail-type
        var comType = this.selectComponents[fieldName][detailType];
        if (!comType) {
            console.error("No component type found for: %s", detailType);
            return;
        }
        var componentFactory = this.componentFactoryResolver.resolveComponentFactory(comType);
        var componentRef = viewContainerRef.createComponent(componentFactory); //create and insert in one call
        var componentInstance = componentRef.instance;
        componentInstance.inputData = id;
        componentInstance.setFocus();
        componentInstance.done.subscribe(function (val) {
            if (val) {
                componentInstance.done.unsubscribe();
                viewContainerRef.clear();
            }
            var outputData = componentInstance.outputData;
            if (outputData) {
                switch (outputData.action) {
                    case "selected":
                        if (_this.arrayFields.some(function (x) { return x[0] == fieldName; })) {
                            _this.detail[fieldName]['selection'].push(outputData.value);
                            var values = [];
                            if (_this.detail[fieldName]['value'])
                                values = _this.detail[fieldName]['value'].split(' | ');
                            values.push(outputData.value.value); //display value
                            values = values.filter(function (x) { return !!x; });
                            _this.detail[fieldName]['value'] = values.join(' | ');
                        }
                        else if (_this.referenceFields.includes(fieldName)) {
                            _this.detail[fieldName] = outputData.value;
                        }
                        //trigger extraInfo populate, once reference changed.
                        _this.extraInfoPopulate();
                        break;
                    case "back":
                        _this.onRefSelect(fieldName);
                        break;
                    default:
                        break;
                }
            }
        });
    };
    BaseComponent.prototype.setFocus = function () {
        if (this.focusEl)
            this.focusEl.nativeElement.focus();
    };
    BaseComponent.prototype.uiCloseModal = function () {
        this.outputData = null;
        this.done.emit(true);
    };
    BaseComponent.prototype.uiOnEscapeKey = function () {
        this.uiCloseModal();
    };
    BaseComponent.prototype.selectItemSelected = function (num) {
        var detail = this.list[num];
        this.selectedId = detail['_id'];
        this.clickedId = detail['_id'];
        this.outputData = { action: "selected",
            value: { "_id": detail["_id"], "value": this.stringify(detail) },
            detail: detail
        };
        this.done.emit(true);
    };
    BaseComponent.prototype.detailSelSelected = function () {
        var detail = this.detail;
        this.outputData = { action: "selected",
            value: { "_id": detail["_id"], "value": this.stringify(detail) },
            detail: detail
        };
        this.done.emit(true);
    };
    BaseComponent.prototype.selectViewDetail = function (num) {
        var detail = this.list[num];
        this.clickedId = detail['_id'];
        this.outputData = { action: "view",
            value: detail["_id"]
        };
        this.done.emit(true);
    };
    BaseComponent.prototype.detailSelBack = function () {
        this.outputData = { action: "back",
            value: null
        };
        this.done.emit(true);
    };
    BaseComponent.prototype.toggleMoreSearch = function () {
        this.moreSearchOpened = !this.moreSearchOpened;
    };
    BaseComponent.prototype.onSearchTextClear = function () {
        this.searchText = undefined;
        if (!this.moreSearchOpened)
            this.searchList();
    };
    BaseComponent.prototype.onSearchClear = function () {
        this.searchText = undefined;
        var detail = {};
        this.detail = this.formatDetail(detail);
        this.searchList();
    };
    BaseComponent.prototype.extraFieldsUnload = function () {
        var _this = this;
        if (this.textEditors) {
            this.textEditors.forEach(function (editor) {
                var fieldName = editor.name;
                var validatorObj = _this.textEditorMap[fieldName];
                if (!validatorObj)
                    return;
                var content = _this.detail[validatorObj.fieldName];
                if (content)
                    editor.setContent(content);
            });
        }
    };
    BaseComponent.prototype.extraFieldsLoad = function () {
        var result = true;
        if (this.textEditors) {
            var array = this.textEditors.toArray();
            for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
                var editor = array_1[_i];
                var fieldName = editor.name;
                var _a = editor.getContent(), content = _a[0], text = _a[1];
                var validatorObj = this.textEditorMap[fieldName];
                if (!validatorObj)
                    continue;
                var fieldState = validatorObj.fieldState;
                fieldState.errors = {};
                if (!content) {
                    if (validatorObj.required) {
                        fieldState.errors.required = true;
                        fieldState.valid = false;
                        result = false;
                    }
                    continue;
                }
                if ('minlength' in validatorObj && text.length < validatorObj.minlength) {
                    fieldState.valid = false;
                    fieldState.errors.minlength = true;
                    result = false;
                    continue;
                }
                if ('maxlength' in validatorObj && text.length > validatorObj.maxlength) {
                    fieldState.valid = false;
                    fieldState.errors.maxlength = true;
                    result = false;
                    continue;
                }
                if ('validators' in validatorObj) {
                    var error = validatorObj['validators'].validateValue(text);
                    if (error) {
                        fieldState.valid = false;
                        fieldState.errors = error;
                        result = false;
                        continue;
                    }
                }
                fieldState.valid = true;
                fieldState.errors = undefined;
                this.detail[validatorObj.fieldName] = content;
            }
        }
        return result;
    };
    BaseComponent.prototype.onEdtiorPreview = function (editorName) {
        if (this.textEditors)
            this.textEditors.forEach(function (editor) {
                if (editor.name == editorName)
                    editor.preview();
            });
    };
    /*Parent router related*/
    BaseComponent.prototype.getParentRouteItem = function () {
        var routeSnapshot = this.route.snapshot;
        var parentItem;
        do {
            if (routeSnapshot.data && routeSnapshot.data.mraLevel == 1) {
                parentItem = routeSnapshot.data.item;
                break;
            }
            routeSnapshot = routeSnapshot.parent;
        } while (routeSnapshot);
        return parentItem;
    };
    BaseComponent.prototype.getParentRouteItemId = function () {
        var routeSnapshot = this.route.snapshot;
        var parentItemId;
        do {
            if (routeSnapshot.data && routeSnapshot.data.mraLevel == 1 && ('id' in routeSnapshot.params)) {
                parentItemId = routeSnapshot.params.id;
                break;
            }
            routeSnapshot = routeSnapshot.parent;
        } while (routeSnapshot);
        return parentItemId;
    };
    BaseComponent.prototype.getParentRouteRefField = function () {
        var mp = this.referenceFieldsMap;
        for (var prop in mp) {
            if (mp.hasOwnProperty(prop) && mp[prop] == this.parentItem) {
                return prop;
            }
        }
    };
    BaseComponent.prototype.getParentActivatedRouter = function () {
        var route = this.route;
        do {
            var data = route.snapshot.data;
            //all route inside the mra system will have mraLevel data item
            if (!data.mraLevel)
                return route;
            route = route.parent;
        } while (route);
        return this.route.root;
    };
    /*Sub detail show flag*/
    BaseComponent.prototype.toggleCheckedItem = function (i) {
        this.checkedItem[i] = !this.checkedItem[i];
    };
    BaseComponent.prototype.onAdd = function () {
        this.isAdding = true;
    };
    BaseComponent.prototype.toggleAdd = function () {
        this.isAdding = !this.isAdding;
    };
    BaseComponent.prototype.onAddDone = function (result) {
        this.isAdding = false;
        if (result) { //add successful. Re-populate the current list
            if (this.view == ViewType.LIST) {
                this.populateList();
            }
        }
        else {
            ; //do nothing
        }
    };
    BaseComponent.prototype.onDateSelectionToggle = function (fn) {
        this.detail[fn]['pop'] = !this.detail[fn]['pop'];
    };
    BaseComponent.prototype.onDateSelection = function (fn, date) {
        if (!this.detail[fn]['from'] && !this.detail[fn]['to']) {
            this.detail[fn]['from'] = date;
        }
        else if (this.detail[fn]['from'] && !this.detail[fn]['to'] && date.after(this.detail[fn]['from'])) {
            this.detail[fn]['to'] = date;
            this.detail[fn]['pop'] = false; //Finished. hide the selection 
        }
        else {
            this.detail[fn]['to'] = null;
            this.detail[fn]['from'] = date;
        }
    };
    BaseComponent.prototype.isHovered = function (fn, date) {
        return this.detail[fn]['from'] && !this.detail[fn]['to'] && this.hoveredDate && date.after(this.detail[fn]['from']) && date.before(this.hoveredDate);
    };
    BaseComponent.prototype.isInside = function (fn, date) {
        return date.after(this.detail[fn]['from']) && date.before(this.detail[fn]['to']);
    };
    BaseComponent.prototype.isRange = function (fn, date) {
        return date.equals(this.detail[fn]['from']) || date.equals(this.detail[fn]['to']) || this.isInside(fn, date) || this.isHovered(fn, date);
    };
    return BaseComponent;
}());
exports.BaseComponent = BaseComponent;
