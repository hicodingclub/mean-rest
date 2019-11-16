"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@Directive({
//    selector: '[mra-richtext-select]',
//})
var MraRichTextSelectDirective = /** @class */ (function () {
    function MraRichTextSelectDirective(el, render) {
        this.el = el;
        this.render = render;
        var id = Date.now();
        //<!-- Create the editor container -->
        var height = "height: 375px;";
        var html = "\n            <div id=\"richtext" + id + "\" style=\"" + height + "\"> test\n            </div>\n        ";
        var quill;
        var toolbarOptions = [
            //[{ 'header': [1, 2, 3, 4, 5, false] }],
            [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            //['blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }],
            //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'align': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            //[{ 'direction': 'rtl' }],                         // text direction
            ['link', 'image']
            //['clean']                                         // remove formatting button
        ];
        var history = {
            delay: 2000,
            maxStack: 500,
            userOnly: true
        };
        this.render.setProperty(this.el.nativeElement, 'innerHTML', html);
        setTimeout(function () {
            quill = new Quill('#richtext' + id, {
                modules: {
                    toolbar: toolbarOptions,
                    history: history,
                    ImageResize: {}
                },
                theme: 'snow'
            });
        }, 1);
    }
    return MraRichTextSelectDirective;
}());
exports.MraRichTextSelectDirective = MraRichTextSelectDirective;
