var modalHtml = `
<div class="meanExpressAngularModal" id="meanExpressAngularModal">
  <div class="meanExpressAngularModal-content">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="meanExpressAngularModalTitle">Modal title from function</h5>
        <button type="button" class="close" id="meanExpressAngularModalClose" aria-label="Close" >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body" id="meanExpressAngularModalBody">
        Hello
      </div>
      <div class="modal-footer" id="meanExpressAngularModalFooter">
      </div>
    </div>
  </div>
</div> 
`;

var modalCss = `
.meanExpressAngularModal {
    display: none; 
    position: fixed; 
    z-index: 100; 
    padding-top: 100px; 
    left: 0;
    top: 0;
    width: 100%;
    height: 100%; 
    overflow: auto; 
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}

.meanExpressAngularModal.show {
    display: block; 
}

.meanExpressAngularModal-content {
    position: relative;
    background-color: #fefefe;
    margin: auto;
    padding: 0;
    border: 1px solid #888;
    width: 50%;
    box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19);
    -webkit-animation-name: modalanimatetop;
    -webkit-animation-duration: 0.4s;
    animation-name: modalanimatetop;
    animation-duration: 0.4s
}

@-webkit-keyframes modalanimatetop {
    from {top:-300px; opacity:0} 
    to {top:0; opacity:1}
}

@keyframes modalanimatetop {
    from {top:-300px; opacity:0}
    to {top:0; opacity:1}
}
`;

declare var $: any;

export class ModalConfig {
    title: string;
    content: string;
    //list of button text
    buttons: string[];
    //list of button returns when clicked
    returns: boolean[];
    callBack: (result) => void;
}

export class Modal {
    constructor(private config: ModalConfig ) {}

    public show() {
        var config = this.config;
        if (!$('#meanExpressAngularModal').length) {
            $("<style type='text/css' id='meanExpressAngularModalCss'>" + modalCss + "</style>").appendTo("head"); 
            $('body').append(modalHtml);
        }
        
        $( "#meanExpressAngularModalFooter" ).empty();
        for (var i=0; i< config.buttons.length; i++) {
            var text = config.buttons[i];
            var button = '<button type="button" class="btn btn-primary" id="meanExpressAngularModalBtn' + i + '" >' + text + '</button>';
            $( "#meanExpressAngularModalFooter" ).append(button);
            
            $( "#meanExpressAngularModalBtn"+i ).click(function(event) {
                $('#meanExpressAngularModal').removeClass("show");
                var index = parseInt(event.target.id.replace("meanExpressAngularModalBtn", ""));
                config.callBack(config.returns[index]);
            });
        }

        $( "#meanExpressAngularModalTitle" ).empty();
        $( "#meanExpressAngularModalTitle" ).append(config.title);
        $( "#meanExpressAngularModalBody" ).empty();
        $( "#meanExpressAngularModalBody" ).append(config.content);

        $( "#meanExpressAngularModalClose" ).click(function() {
            $('#meanExpressAngularModal').removeClass("show");
            config.callBack(false);
        });

        $('#meanExpressAngularModal').addClass("show");
    }
    
    public hide() {
        $('#meanExpressAngularModal').removeClass("show");
    }
}
