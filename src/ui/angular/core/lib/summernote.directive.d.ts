import { ElementRef, Renderer2 } from '@angular/core';
export declare class MraRichTextSelectDirective {
    private el;
    private render;
    name: string;
    content: string;
    private id;
    constructor(el: ElementRef, render: Renderer2);
    setContent(content: string): void;
    getContent(): string[];
    preview(): void;
}
export declare class MraRichTextShowDirective {
    private el;
    private render;
    name: string;
    constructor(el: ElementRef, render: Renderer2);
    setContent(content: string): void;
}
