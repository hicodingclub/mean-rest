import { ElementRef, Renderer2, Directive} from '@angular/core';

//Please include quill
//<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
//<script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>

declare var Quill: any;

//@Directive({
//    selector: '[mra-richtext-select]',
//})
export class MraRichTextSelectDirective {
    constructor(private el: ElementRef, private render: Renderer2) {
        let id = Date.now();
        //<!-- Create the editor container -->
        let height = "height: 375px;";
        let html = `
            <div id="richtext` + id +`" style="` + height + `"> test
            </div>
        `;

        let quill;
        
        var toolbarOptions = [
           //[{ 'header': [1, 2, 3, 4, 5, false] }],
           [{ 'font': [] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown

            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
           //['blockquote', 'code-block'],
            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        
           //[{ 'header': 1 }, { 'header': 2 }],               // custom button values
           [{ 'align': [] }],
           [{ 'list': 'ordered'}, { 'list': 'bullet' }],
           //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
           [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
           //[{ 'direction': 'rtl' }],                         // text direction
           ['link', 'image']
          //['clean']                                         // remove formatting button
        ];

        var history = {
          delay: 2000,
          maxStack: 500,
          userOnly: true
        }

        
        this.render.setProperty(this.el.nativeElement, 'innerHTML', html);
        setTimeout(()=> {
            quill = new Quill('#richtext' + id, 
                {
                    modules: {
                        toolbar: toolbarOptions,
                        history: history,
                        ImageResize: {}
                      },
                    theme: 'snow'
                });
        }, 1);
    }
}
