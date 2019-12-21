const snackBarCss = `
.meanExpressAngularSnackBar {
    visibility: hidden;
    min-width: 250px;
    margin-left: -125px;
    background-color: #333;
    color: #fff;
    text-align: center;
    border-radius: 2px;
    padding: 16px;
    position: fixed;
    z-index: 1;
    left: 50%;
    bottom: 30px;
}

.meanExpressAngularSnackBar.show {
    visibility: visible;

    -webkit-animation: snackbarfadein 0.5s, snackbarfadeout 0.5s 2.5s;
    animation: snackbarfadein 0.5s, snackbarfadeout 0.5s 2.5s;
}

@-webkit-keyframes snackbarfadein {
    from {bottom: 0; opacity: 0;}
    to {bottom: 30px; opacity: 1;}
}

@keyframes snackbarfadein {
    from {bottom: 0; opacity: 0;}
    to {bottom: 30px; opacity: 1;}
}

@-webkit-keyframes snackbarfadeout {
    from {bottom: 30px; opacity: 1;}
    to {bottom: 0; opacity: 0;}
}

@keyframes snackbarfadeout {
    from {bottom: 30px; opacity: 1;}
    to {bottom: 0; opacity: 0;}
}
`;
declare const $: any;

export class SnackBarConfig {
    content: string;
}

export class SnackBar {

    constructor(private config: SnackBarConfig ) {}
    private getHtml() {
        const id = 'meanExpressAngularSnackBar' + Date.now();
        const snackBarHtml = `
<div class="meanExpressAngularSnackBar" id="` + id + `">

</div>
`;
        return {id, html: snackBarHtml};
    }

    public show() {
        if (!$('#meanExpressAngularSnackBarCss').length) {
            $('<style type=\'text/css\' id=\'meanExpressAngularSnackBarCss\'>' + snackBarCss + '</style>').appendTo('head');
        }

        const html = this.getHtml();
        const selector = '#' + html.id;
        $('body').append(html.html);
        $(selector).append(this.config.content);

        $(selector).addClass('show');

        setTimeout(() => {
            $(selector).removeClass('show');
            setTimeout(() => {$(selector).remove(); }, 500);
         }, 3000);
    }

}
