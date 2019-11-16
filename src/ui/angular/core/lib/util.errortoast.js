"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errorCss = "\n.meanExpressAngularError {\n    visibility: hidden; \n    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);\n    min-width: 250px; \n    max-width: 60%;\n    left: 50%;\n    top: 20%;\n    transform: translate(-50%, 0);\n    position: fixed; \n    z-index: 10; \n}\n.meanExpressAngularError.show {\n    visibility: visible; \n}\n\n.meanExpressAngularErrorMoreLink {\n    display: none;\n}\n.meanExpressAngularErrorMoreLink.show {\n    display: block;\n}\n.meanExpressAngularErrorMore {\n    display: none;\n    font-size: 0.75rem;\n    font-color: black;\n    background-color: gray;\n}\n.meanExpressAngularErrorMore.show {\n    display: block;\n}\n";
var ErrorToastConfig = /** @class */ (function () {
    function ErrorToastConfig() {
    }
    return ErrorToastConfig;
}());
exports.ErrorToastConfig = ErrorToastConfig;
var ErrorToast = /** @class */ (function () {
    function ErrorToast(config) {
        this.config = config;
    }
    ErrorToast.prototype.getHtml = function () {
        var id = 'meanExpressAngularError' + Date.now();
        var errorHtml = "\n<div class=\"alert alert-danger fade in alert-dismissible meanExpressAngularError\"\n    id=\"" + id + "\">\n <button type=\"button\" class=\"close\" aria-label=\"Close\" id=\"button" + id + "\">\n    <span aria-hidden=\"true\" style=\"font-size:20px\">\u00D7</span>\n  </button>\n  <div>\n    <strong>Error!</strong>\n  </div>\n  <div id=\"content" + id + "\">\n  </div>\n  <a id=\"link" + id + "\" class=\"meanExpressAngularErrorMoreLink\" href=\".\" >Show more details...\n  </a>\n  <div id=\"more" + id + "\" class=\"meanExpressAngularErrorMore\">\n  </div>\n</div>\n";
        return { id: id, html: errorHtml };
    };
    ErrorToast.prototype.show = function () {
        if (!$('#meanExpressAngularErrorCss').length) {
            $("<style type='text/css' id='meanExpressAngularErrorCss'>" + errorCss + "</style>").appendTo("head");
        }
        var html = this.getHtml();
        var selector = '#' + html.id;
        var contentSelector = '#content' + html.id;
        var moreSelector = '#more' + html.id;
        var linkSelector = '#link' + html.id;
        var buttonSelector = '#button' + html.id;
        $('body').append(html.html);
        $(contentSelector).append(this.config.content);
        if (this.config.more) {
            $(moreSelector).append(this.config.more);
            $(linkSelector).addClass("show");
            $(linkSelector).click(function (event) {
                event.preventDefault();
                $(moreSelector).addClass("show");
            });
        }
        $(buttonSelector).click(function (event) { $(selector).removeClass("show"); });
        $(selector).addClass("show");
    };
    return ErrorToast;
}());
exports.ErrorToast = ErrorToast;
