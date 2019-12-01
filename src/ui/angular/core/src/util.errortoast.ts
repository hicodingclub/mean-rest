var errorCss = `
.meanExpressAngularError {
    visibility: hidden; 
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19);
    min-width: 250px; 
    max-width: 60%;
    left: 50%;
    top: 20%;
    transform: translate(-50%, 0);
    position: fixed; 
    z-index: 1050; 
}
.meanExpressAngularError.show {
    visibility: visible; 
}

.meanExpressAngularErrorMoreLink {
    display: none;
}
.meanExpressAngularErrorMoreLink.show {
    display: block;
}
.meanExpressAngularErrorMore {
    display: none;
    font-size: 0.75rem;
    font-color: black;
    background-color: gray;
}
.meanExpressAngularErrorMore.show {
    display: block;
}
`;

declare var $: any;

export class ErrorToastConfig {
    content: string;
    more: string;
}

export class ErrorToast {
    
    constructor(private config: ErrorToastConfig ) {}
    private getHtml() {
        var id = 'meanExpressAngularError' + Date.now();
        var errorHtml = `
<div class="alert alert-danger fade in alert-dismissible meanExpressAngularError"
    id="`+id+`">
 <button type="button" class="close" aria-label="Close" id="button`+id+`">
    <span aria-hidden="true" style="font-size:20px">×</span>
  </button>
  <div>
    <strong>Error!</strong>
  </div>
  <div id="content`+id+`">
  </div>
  <a id="link`+id+`" class="meanExpressAngularErrorMoreLink" href="." >Show more details...
  </a>
  <div id="more`+id+`" class="meanExpressAngularErrorMore">
  </div>
</div>
`;
        return {id: id, html: errorHtml};
    }

    public show() {
        if (!$('#meanExpressAngularErrorCss').length) {
            $("<style type='text/css' id='meanExpressAngularErrorCss'>" + errorCss + "</style>").appendTo("head"); 
        }
        var html = this.getHtml();
        var selector = '#' + html.id;
        var contentSelector = '#content' + html.id;
        var moreSelector = '#more' + html.id;
        var linkSelector = '#link' + html.id;
        var buttonSelector = '#button' + html.id;
        $('body').append(html.html);
        $(contentSelector).append(this.config.content);
        if (this.config.more) {
            $(moreSelector).append(this.config.more);
            $(linkSelector).addClass("show");
            $(linkSelector).click(function(event) {
                event.preventDefault();
                $(moreSelector).addClass("show");
            });
        }
        $(buttonSelector).click(function(event) {$(selector).removeClass("show");});
        
        $(selector).addClass("show");
    }

}
