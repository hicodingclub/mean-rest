"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modalHtml = "\n<div class=\"meanExpressAngularModal\" id=\"meanExpressAngularModal\">\n  <div class=\"meanExpressAngularModal-content\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h5 class=\"modal-title\" id=\"meanExpressAngularModalTitle\">Modal title from function</h5>\n        <button type=\"button\" class=\"close\" id=\"meanExpressAngularModalClose\" aria-label=\"Close\" >\n          <span aria-hidden=\"true\">&times;</span>\n        </button>\n      </div>\n      <div class=\"modal-body\" id=\"meanExpressAngularModalBody\">\n        Hello\n      </div>\n      <div class=\"modal-footer\" id=\"meanExpressAngularModalFooter\">\n      </div>\n    </div>\n  </div>\n</div> \n";
var modalCss = "\n.meanExpressAngularModal {\n    display: none; \n    position: fixed; \n    z-index: 100; \n    padding-top: 100px; \n    left: 0;\n    top: 0;\n    width: 100%;\n    height: 100%; \n    overflow: auto; \n    background-color: rgb(0,0,0);\n    background-color: rgba(0,0,0,0.4);\n}\n\n.meanExpressAngularModal.show {\n    display: block; \n}\n\n.meanExpressAngularModal-content {\n    position: relative;\n    background-color: #fefefe;\n    margin: auto;\n    padding: 0;\n    border: 1px solid #888;\n    width: 50%;\n    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);\n    -webkit-animation-name: modalanimatetop;\n    -webkit-animation-duration: 0.4s;\n    animation-name: modalanimatetop;\n    animation-duration: 0.4s\n}\n\n@-webkit-keyframes modalanimatetop {\n    from {top:-300px; opacity:0} \n    to {top:0; opacity:1}\n}\n\n@keyframes modalanimatetop {\n    from {top:-300px; opacity:0}\n    to {top:0; opacity:1}\n}\n";
var ModalConfig = /** @class */ (function () {
    function ModalConfig() {
    }
    return ModalConfig;
}());
exports.ModalConfig = ModalConfig;
var Modal = /** @class */ (function () {
    function Modal(config) {
        this.config = config;
    }
    Modal.prototype.show = function () {
        var config = this.config;
        if (!$('#meanExpressAngularModal').length) {
            $("<style type='text/css' id='meanExpressAngularModalCss'>" + modalCss + "</style>").appendTo("head");
            $('body').append(modalHtml);
        }
        $("#meanExpressAngularModalFooter").empty();
        for (var i = 0; i < config.buttons.length; i++) {
            var text = config.buttons[i];
            var button = '<button type="button" class="btn btn-primary" id="meanExpressAngularModalBtn' + i + '" >' + text + '</button>';
            $("#meanExpressAngularModalFooter").append(button);
            $("#meanExpressAngularModalBtn" + i).click(function (event) {
                $('#meanExpressAngularModal').removeClass("show");
                var index = parseInt(event.target.id.replace("meanExpressAngularModalBtn", ""));
                config.callBack(config.returns[index]);
            });
        }
        $("#meanExpressAngularModalTitle").empty();
        $("#meanExpressAngularModalTitle").append(config.title);
        $("#meanExpressAngularModalBody").empty();
        $("#meanExpressAngularModalBody").append(config.content);
        $("#meanExpressAngularModalClose").click(function () {
            $('#meanExpressAngularModal').removeClass("show");
            config.callBack(false);
        });
        $('#meanExpressAngularModal').addClass("show");
    };
    Modal.prototype.hide = function () {
        $('#meanExpressAngularModal').removeClass("show");
    };
    return Modal;
}());
exports.Modal = Modal;
