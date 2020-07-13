import { ElementRef, Renderer2, Directive, Input, OnChanges} from '@angular/core';


@Directive({
    selector: '[libMddsRichtextShow]',
})
export class MddsRichTextShowDirective implements OnChanges {
  @Input() content: string;
  constructor(private el: ElementRef, private render: Renderer2) {
  }

  ngOnChanges() {
    let content = this.content || '';
    this.setContent(content);
  }

  setContent(content: string) {
    this.render.setProperty(this.el.nativeElement, 'innerHTML', content);
  }
}
