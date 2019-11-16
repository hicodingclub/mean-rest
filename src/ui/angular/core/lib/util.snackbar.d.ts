export declare class SnackBarConfig {
    content: string;
}
export declare class SnackBar {
    private config;
    constructor(config: SnackBarConfig);
    private getHtml;
    show(): void;
}
