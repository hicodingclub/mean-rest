import {
  ElementRef,
  ViewChild,
  Renderer2,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewChecked,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NG_VALIDATORS, FormControl } from '@angular/forms';

declare var $: any;

export function createValidator(required: boolean, maxlength: number, minlength: number) {
  return function validate(c: FormControl) {
    if (!c.value) {
      if (required) {
        return {
          required: 'value is required.'
        };
      }
      return null;
    }
    let min = minlength || 0;
    if (c.value.length < min) {
      return {
        minlength: `length is less than ${min}`,
      };
    }
    if (maxlength && c.value.length > maxlength) {
      return {
        maxlength: `length is larger than ${maxlength}`
      };
    }
    return null;
  }
}

const EMPTY_EDITOR_STRINGS = [
  '<br>', '<p><br></p>', '<br/>', '<p></p>',
];

@Component({
  selector: "lib-richtext-editor",
  templateUrl: "richtext.editor.component.html",
  styleUrls: ["richtext.editor.component.css"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: MddsRichtextEditorComponent, // !IMPORTANT: not working with forwardRef(() => MddsRichtextEditor),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: MddsRichtextEditorComponent,
      multi: true,
    },
  ],
})
export class MddsRichtextEditorComponent
  implements ControlValueAccessor, AfterViewChecked, OnChanges {
  @Input() required: boolean = false;
  @Input() maxlength: number;
  @Input() minlength: number;
  @ViewChild("richText", { static: true }) richTextEl: ElementRef;
  @ViewChild("previewDiv", { static: false }) previewEl: ElementRef;

  public id: number = Date.now();
  public richtextId: string = `richtext${this.id}`;
  public previewFlag: boolean = false;

  private summernoteInit: boolean = false;
  private content: string = "";

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
        ["font", ["style", "fontname", "fontsize", "color"]],
        ["style", ["bold", "italic", "underline"]], // , 'strikethrough'
        // ['font', [ 'superscript', 'subscript','clear']],
        ["paragraph", ["ul", "ol", "paragraph"]], // , 'height'
        ["insert", ["table", "picture", "link", "video"]], // , 'hr'
        // ['misc', ['undo', 'redo', 'print', 'help', 'fullscreen']]
        ["misc", ["undo", "redo", "fullscreen"]],
      ],
      callbacks: {
        onChange: (content: string) => {
          if (EMPTY_EDITOR_STRINGS.includes(content)) { // empty
            content = '';
          }
          this.content = content;
          this.onChange(content);
        },
        onBlurCodeview: () => {
          this.onTouched();
        },
        onBlur: () => {
          this.onTouched();
        },
      },
    };
    this.validateFn = createValidator(this.required, this.maxlength, this.minlength);
  }

  onChange: any = () => {};
  onTouched: any = () => {};
  validateFn: (c: FormControl) => any;

  ngAfterViewChecked() {
    // preview enabled
    if (this.previewEl) {
      const html = this.getContent();
      this.render.setProperty(this.previewEl.nativeElement, "innerHTML", html);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.validateFn = createValidator(this.required, this.maxlength, this.minlength);
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
    this.setContent(value);
  }

  // ng validator
  validate(c: FormControl) {
    return this.validateFn(c);
  }

  setContent(content: string) {
    if (EMPTY_EDITOR_STRINGS.includes(content)) { // empty
      content = '';
    }
    let newContent = content || "";
    if (this.summernoteInit) {
      if (newContent === this.content) {
        return;
      }
      $(`#${this.richtextId}`).summernote("destroy");
      this.summernoteInit = false;
    }
    this.content = newContent;
    this.render.setProperty(
      this.richTextEl.nativeElement,
      "innerHTML",
      this.content
    );
    setTimeout(() => {
      $(`#${this.richtextId}`).summernote(this.summerNoteConfig);
      this.summernoteInit = true;
    }, 10);    
  }

  getContent(): string[] {
    let html = $(`#${this.richtextId}`).summernote("code");
    html = html.replace("http:///", "/"); // restore local link
    return html;
  }

  preview() {
    this.previewFlag = true;
  }

  previewClose() {
    this.previewFlag = false;
  }
}
