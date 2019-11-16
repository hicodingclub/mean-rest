"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var snackBarCss = "\n.meanExpressAngularSnackBar {\n    visibility: hidden;\n    min-width: 250px;\n    margin-left: -125px;\n    background-color: #333;\n    color: #fff;\n    text-align: center; \n    border-radius: 2px; \n    padding: 16px; \n    position: fixed;\n    z-index: 1;\n    left: 50%;\n    bottom: 30px;\n}\n\n.meanExpressAngularSnackBar.show {\n    visibility: visible;\n\n    -webkit-animation: snackbarfadein 0.5s, snackbarfadeout 0.5s 2.5s;\n    animation: snackbarfadein 0.5s, snackbarfadeout 0.5s 2.5s;\n}\n\n@-webkit-keyframes snackbarfadein {\n    from {bottom: 0; opacity: 0;} \n    to {bottom: 30px; opacity: 1;}\n}\n\n@keyframes snackbarfadein {\n    from {bottom: 0; opacity: 0;}\n    to {bottom: 30px; opacity: 1;}\n}\n\n@-webkit-keyframes snackbarfadeout {\n    from {bottom: 30px; opacity: 1;} \n    to {bottom: 0; opacity: 0;}\n}\n\n@keyframes snackbarfadeout {\n    from {bottom: 30px; opacity: 1;}\n    to {bottom: 0; opacity: 0;}\n}\n";
var SnackBarConfig = /** @class */ (function () {
    function SnackBarConfig() {
    }
    return SnackBarConfig;
}());
exports.SnackBarConfig = SnackBarConfig;
var SnackBar = /** @class */ (function () {
    function SnackBar(config) {
        this.config = config;
    }
    SnackBar.prototype.getHtml = function () {
        var id = 'meanExpressAngularSnackBar' + Date.now();
        var snackBarHtml = "\n<div class=\"meanExpressAngularSnackBar\" id=\"" + id + "\">\n\n</div>\n";
        return { id: id, html: snackBarHtml };
    };
    SnackBar.prototype.show = function () {
        if (!$('#meanExpressAngularSnackBarCss').length) {
            $("<style type='text/css' id='meanExpressAngularSnackBarCss'>" + snackBarCss + "</style>").appendTo("head");
        }
        var html = this.getHtml();
        var selector = '#' + html.id;
        $('body').append(html.html);
        $(selector).append(this.config.content);
        $(selector).addClass("show");
        setTimeout(function () {
            $(selector).removeClass("show");
            setTimeout(function () { $(selector).remove(); }, 500);
        }, 3000);
    };
    return SnackBar;
}());
exports.SnackBar = SnackBar;
