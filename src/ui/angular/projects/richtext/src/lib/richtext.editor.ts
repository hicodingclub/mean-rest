import { ElementRef, ViewChild, Renderer2, Component, Input, AfterViewInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare var $: any;

const fullscreenCss = `

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

const fullscreenHtml = `
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


@Component({
  selector: 'lib-richtext-editor',
  templateUrl: 'richtext.editor.html',
  styleUrls: ['richtext.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MddsRichtextEditorComponent, // !IMPORTANT: not working with forwardRef(() => MddsRichtextEditor),
      multi: true
    }
  ],
})
export class MddsRichtextEditorComponent implements AfterViewInit, ControlValueAccessor {
  @Input() content = '';
  @ViewChild('thisDiv', {static: true}) el: ElementRef;
  private id;

  summerNoteConfig: any;

  constructor(private render: Renderer2) {
    this.summerNoteConfig = {
      minHeight: 200,
      focus: false,
      airMode: false,
      // fontNames: ['Roboto', 'Calibri', 'Times New Roman', 'Arial'],
      // fontNamesIgnoreCheck: ['Roboto', 'Calibri'],
      dialogsInBody: true,
      dialogsFade: true,
      disableDragAndDrop: false,
      toolbar: [
        // [groupName, [list of button]]
        ['font', ['style', 'fontname', 'fontsize', 'color']],
        ['style', ['bold', 'italic', 'underline']], // , 'strikethrough'
        // ['font', [ 'superscript', 'subscript','clear']],
         ['paragraph', ['ul', 'ol', 'paragraph']], // , 'height'
         ['insert', ['table', 'picture', 'link', 'video']], // , 'hr'
        // ['misc', ['undo', 'redo', 'print', 'help', 'fullscreen']]
        ['misc', ['undo', 'redo', 'fullscreen']]
      ],
      callbacks: {
        onChange: (contents) => {
          this.onChange(contents);
        },
        onBlurCodeview: () => {
          this.onTouched();
        },
        onBlur: () => {
          this.onTouched();
        }
      },
    }
  }

  onChange: any = () => { };
  onTouched: any = () => { };

  ngAfterViewInit() {
    this.id = Date.now();

    // <!-- Create the editor container -->
    const html = `
      <div id="richtext` + this.id + `">
      </div>
      <div id="fullscreen` + this.id + `"></div>
      `;

    if (!$('#mraeditorfullscreenCss').length) {
      $('<style type=\'text/css\' id=\'mraeditorfullscreenCss\'>' + fullscreenCss + '</style>').appendTo('head');
    }

    this.render.setProperty(this.el.nativeElement, 'innerHTML', html);

    setTimeout(() => {
        if (this.content) { $('#richtext' + this.id).html(this.content); }
        $('#richtext' + this.id).summernote(this.summerNoteConfig);
    }, 1);
  }

  // We implement this method to keep a reference to the onChange
  // callback function passed by the forms API
  registerOnChange(fn) {
    this.onChange = fn;
  }
  // We implement this method to keep a reference to the onTouched
  // callback function passed by the forms API
  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  writeValue(value: any) {
    if (value) {
      this.setContent(value);
    }
  }

  setContent(content: string) {
    this.content = content;
    if (this.content) {
      $('#richtext' + this.id).each(function( index ) {
        $(this).summernote('destroy');
      });
      $('#richtext' + this.id).html(this.content);
      $('#richtext' + this.id).summernote(this.summerNoteConfig);
    }
  }

  getContent(): string[] {
    const html = $('#richtext' + this.id).summernote('code');
    const text = $('<div>' + html + '</div>').text();
    return [html, text];
  }

  preview() {
    if (!$('#mraeditorfullscreenDiv').length) {
        $('#fullscreen' + this.id).append(fullscreenHtml);
    }

    $('#mraeditorfullscreenClose' ).click(() => {
        $('#mraeditorfullscreenDiv').remove();
    });

    const [html, _] = this.getContent();
    $('#mrafullscreenHtml').html(html);
  }
}
