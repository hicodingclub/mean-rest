export declare class ModalConfig {
    title: string;
    content: string;
    buttons: string[];
    returns: boolean[];
    callBack: (result: any) => void;
}
export declare class Modal {
    private config;
    constructor(config: ModalConfig);
    show(): void;
    hide(): void;
}
