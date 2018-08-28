import { ElementRef, Renderer2, Directive} from '@angular/core';

@Directive({
    selector: '[mra-richtext-select]',
})
export class MraRichTextSelectDirective {
    constructor(private el: ElementRef, private render: Renderer2) {
        this.render.setProperty(this.el.nativeElement, 'innerHTML', "Let's test this");
    }
}
