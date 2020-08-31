import { Component } from '@angular/core';

@Component({
  selector: 'lib-mdds-loader',
  template: `
<div class="loader-modal">
    <div class="centered">
        <div class="loader"></div>
    </div>
</div>
  `,
  styles: [`
  .loader {
    border: 16px solid #f3f3f3; /* Light grey */
    border-top: 16px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: spin 2s linear infinite;
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  .loader-modal {
    z-index: 2100;
    display: block;
    padding-top: 0px;
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.2);
  }
  .centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  `],
})
export class MDDSLoaderComponent {
  constructor() {}
}
