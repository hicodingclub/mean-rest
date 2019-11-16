export declare class ErrorToastConfig {
    content: string;
    more: string;
}
export declare class ErrorToast {
    private config;
    constructor(config: ErrorToastConfig);
    private getHtml;
    show(): void;
}
