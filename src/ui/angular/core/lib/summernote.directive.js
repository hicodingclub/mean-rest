"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var fullscreenCss = "\n\n.editorhide {\n    display: none;\n}\n.editorfullscreen {\n    display: block;\n    position: fixed; \n    left: 0;\n    top: 0;\n    width: 100%;\n    height: 100%; \n    overflow: auto; \n    z-index: 1050;\n    background-color: #fff;\n}\n\n.editor-action-buttons {\n    width: 100%;\n    float:right; \n    text-align: right;\n    margin-bottom: 1.25rem;\n    margin-top: 2.5rem;\n}\n.editor-action-buttons .btn {\n    display: inline-block;\n    margin-left: 2.5rem;\n}\n\n";
var fullscreenHtml = "\n<div class=\"editorfullscreen\" id=\"mraeditorfullscreenDiv\">\n\n<div class=\"container\">\n  <div class=\"row\">\n    <div class=\"col\">\n      <div class=\"editor-action-buttons\">\n            <button id=\"mraeditorfullscreenClose\" class=\"btn btn-outline-success\">Close</button>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"row\">\n    <div class=\"col\">\n        <div class=\"card\">\n            <div class=\"card-body\" id=\"mrafullscreenHtml\"></div>\n        </div>\n    </div>\n  </div>\n</div>\n\n</div>\n";
var summerNoteConfig = {
    minHeight: 200,
    focus: false,
    airMode: false,
    //fontNames: ['Roboto', 'Calibri', 'Times New Roman', 'Arial'],
    //fontNamesIgnoreCheck: ['Roboto', 'Calibri'],
    dialogsInBody: true,
    dialogsFade: true,
    disableDragAndDrop: false,
    toolbar: [
        // [groupName, [list of button]]
        ['font', ['style', 'fontname', 'fontsize', 'color']],
        ['style', ['bold', 'italic', 'underline']],
        //['font', [ 'superscript', 'subscript','clear']],
        ['paragraph', ['ul', 'ol', 'paragraph']],
        ['insert', ['table', 'picture', 'link', 'video']],
        //['misc', ['undo', 'redo', 'print', 'help', 'fullscreen']]
        ['misc', ['undo', 'redo', 'fullscreen']]
    ],
};
var MraRichTextSelectDirective = /** @class */ (function () {
    function MraRichTextSelectDirective(el, render) {
        var _this = this;
        this.el = el;
        this.render = render;
        this.id = Date.now();
        //<!-- Create the editor container -->
        var html = "\n            <div id=\"richtext" + this.id + "\">\n            </div>\n            <div id=\"fullscreen" + this.id + "\"></div>'\n            ";
        if (!$('#mraeditorfullscreenCss').length) {
            $("<style type='text/css' id='mraeditorfullscreenCss'>" + fullscreenCss + "</style>").appendTo("head");
        }
        this.render.setProperty(this.el.nativeElement, 'innerHTML', html);
        setTimeout(function () {
            if (_this.content)
                $("#richtext" + _this.id).html(_this.content);
            $("#richtext" + _this.id).summernote(summerNoteConfig);
        }, 1);
    }
    MraRichTextSelectDirective.prototype.setContent = function (content) {
        this.content = content;
        if (this.content) {
            $("#richtext" + this.id).each(function (index) {
                $(this).summernote('destroy');
            });
            $("#richtext" + this.id).html(this.content);
            $("#richtext" + this.id).summernote(summerNoteConfig);
        }
    };
    MraRichTextSelectDirective.prototype.getContent = function () {
        var html = $("#richtext" + this.id).summernote('code');
        var text = $("<div>" + html + "</div>").text();
        return [html, text];
    };
    MraRichTextSelectDirective.prototype.preview = function () {
        if (!$('#mraeditorfullscreenDiv').length) {
            $("#fullscreen" + this.id).append(fullscreenHtml);
        }
        $("#mraeditorfullscreenClose").click(function () {
            $('#mraeditorfullscreenDiv').remove();
        });
        var _a = this.getContent(), html = _a[0], text = _a[1];
        $("#mrafullscreenHtml").html(html);
    };
    __decorate([
        core_1.Input('mra-richtext-select')
    ], MraRichTextSelectDirective.prototype, "name", void 0);
    MraRichTextSelectDirective = __decorate([
        core_1.Directive({
            selector: '[mra-richtext-select]',
        })
    ], MraRichTextSelectDirective);
    return MraRichTextSelectDirective;
}());
exports.MraRichTextSelectDirective = MraRichTextSelectDirective;
var MraRichTextShowDirective = /** @class */ (function () {
    function MraRichTextShowDirective(el, render) {
        this.el = el;
        this.render = render;
    }
    MraRichTextShowDirective.prototype.setContent = function (content) {
        var id = Date.now();
        var displayHtml = "\n            <div class=\"card\">\n                <div class=\"card-body\" id=\"mraeditordisplay" + id + "\"></div>\n            </div>\n        ";
        this.render.setProperty(this.el.nativeElement, 'innerHTML', displayHtml);
        $("#mraeditordisplay" + id).html(content);
    };
    __decorate([
        core_1.Input('mra-richtext-show')
    ], MraRichTextShowDirective.prototype, "name", void 0);
    MraRichTextShowDirective = __decorate([
        core_1.Directive({
            selector: '[mra-richtext-show]',
        })
    ], MraRichTextShowDirective);
    return MraRichTextShowDirective;
}());
exports.MraRichTextShowDirective = MraRichTextShowDirective;
