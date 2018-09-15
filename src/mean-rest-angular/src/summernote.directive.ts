import { ElementRef, Renderer2, Directive, Input} from '@angular/core';

declare var $: any;

var fullscreenCss = `

.editorhide {
    display: none;
}
.editorfullscreen {
    display: block;
    position: fixed; 
    left: 0;
    top: 0;
    width: 100%;
    height: 100%; 
    overflow: auto; 
    z-index: 1050;
    background-color: #fff;
}

.editor-action-buttons {
    width: 100%;
    float:right; 
    text-align: right;
    margin-bottom: 1.25rem;
    margin-top: 2.5rem;
}
.editor-action-buttons .btn {
    display: inline-block;
    margin-left: 2.5rem;
}

`;

var fullscreenHtml = `
<div class="editorfullscreen" id="mraeditorfullscreenDiv">

<div class="container">
  <div class="row">
    <div class="col">
      <div class="editor-action-buttons">
            <button id="mraeditorfullscreenClose" class="btn btn-outline-success">Close</button>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col">
        <div class="card">
            <div class="card-body" id="mrafullscreenHtml"></div>
        </div>
    </div>
  </div>
</div>

</div>
`;


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
            ['font', ['style', 'fontname','fontsize', 'color']],
            ['style', ['bold', 'italic', 'underline']],//, 'strikethrough'
            //['font', [ 'superscript', 'subscript','clear']],
             ['paragraph', ['ul', 'ol', 'paragraph']],//, 'height'
             ['insert', ['table', 'picture', 'link', 'video']],//, 'hr'
            //['misc', ['undo', 'redo', 'print', 'help', 'fullscreen']]
            ['misc', ['undo', 'redo', 'fullscreen']]
          ],
//          popover: {
//            air: [
//              ['color', ['color']],
//              ['font', ['bold', 'underline', 'clear']]
//            ]
//          }
        }

@Directive({
    selector: '[mra-richtext-select]',
})
export class MraRichTextSelectDirective {
    @Input('mra-richtext-select') name: string;

    content:string;
    private id;
    
    constructor(private el: ElementRef, private render: Renderer2) {
        this.id = Date.now();

        //<!-- Create the editor container -->
        let html = `
            <div id="richtext` + this.id +`">
            </div>
            <div id="fullscreen` + this.id +`"></div>'
            `; 

        if (!$('#mraeditorfullscreenCss').length) {
            $("<style type='text/css' id='mraeditorfullscreenCss'>" + fullscreenCss + "</style>").appendTo("head"); 
        }


        this.render.setProperty(this.el.nativeElement, 'innerHTML', html);
        
        
        setTimeout(()=> {
            if (this.content) $("#richtext"+this.id).html(this.content);
            $("#richtext"+this.id).summernote(summerNoteConfig);
        }, 1);
    }
    
    setContent(content:string) {
        this.content = content;
        if (this.content) {
            $("#richtext"+this.id).each(function( index ) {
              $(this).summernote('destroy');
            });            
            $("#richtext"+this.id).html(this.content);
            $("#richtext"+this.id).summernote(summerNoteConfig);
        }
    }
    
    getContent():string[] {
        let html = $("#richtext"+this.id).summernote('code');
        let text = $("<div>"+html+"</div>").text();
        return [html, text];
    }
    preview() {
        
        if (!$('#mraeditorfullscreenDiv').length) {
            $("#fullscreen"+this.id).append(fullscreenHtml); 
        }

        $("#mraeditorfullscreenClose" ).click(function() {
            $('#mraeditorfullscreenDiv').remove();
        });

        let [html, text] = this.getContent();
        $("#mrafullscreenHtml").html(html);
    }
}

@Directive({
    selector: '[mra-richtext-show]',
})
export class MraRichTextShowDirective {
    @Input('mra-richtext-show') name: string;
    constructor(private el: ElementRef, private render: Renderer2) {
    }
    
    setContent(content:string) {
        let id = Date.now();
        var displayHtml = `
            <div class="card">
                <div class="card-body" id="mraeditordisplay` + id +`"></div>
            </div>
        `;

        this.render.setProperty(this.el.nativeElement, 'innerHTML', displayHtml);
        $("#mraeditordisplay" + id).html(content);
    }
    
}
