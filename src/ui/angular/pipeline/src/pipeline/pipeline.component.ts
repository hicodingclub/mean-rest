import { Component, Input, AfterViewInit, ViewContainerRef,  Directive, ComponentFactoryResolver } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Injector, EventEmitter } from '@angular/core';

import { Location } from '@angular/common';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export type pipelineSteps = {stepName: string, stepComponent: any}[];

import { } from '@angular/core';
@Directive({
  selector: '[pipeline-directive]',
})
export class PipelineDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'app-pipeline',
    templateUrl: 'pipeline.component.html',
    styleUrls: ['pileline.component.css'],
})
export class PipelineComponent implements AfterViewInit{
    @Input()
    public steps: pipelineSteps;

    public nextStep: number = 0;
    public totalSteps: number;
    public stepCompRef = {};

    @ViewChild(PipelineDirective)
    pipelineDirective: PipelineDirective;

    constructor(public componentFactoryResolver: ComponentFactoryResolver) {}
  
    ngAfterViewInit() {
        if (!this.pipelineDirective) {
            console.warn("No pipeline directive for PipelineComponent.");
            return;
        }

        if (!this.steps) {
            console.warn("No steps defined for PipelineComponent.");
            return;
        }
        this.totalSteps = this.steps.length;
        this.nextStep = 0;

        this.loadNextStep();
    }

    loadNextStep() {
        const { stepName, stepComponent } = this.steps[this.nextStep];

        let viewContainerRef = this.pipelineDirective.viewContainerRef;
        viewContainerRef.clear();

        let componentRef = this.stepCompRef[stepName]; // check if it is created already
        if (!componentRef) {
            let componentFactory = this.componentFactoryResolver.resolveComponentFactory(stepComponent);
            componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call
            this.selectComponents[stepName] = componentRef; // save it
        } else {
            viewContainerRef.insert(componentRef.hostView);
        }

        let componentInstance = <BaseComponentInterface>componentRef.instance;
        componentInstance.setFocus();

        this.componentSubscription = componentInstance.done.subscribe( (val) => {
            if (val) {
                this.componentSubscription.unsubscribe();
                viewContainerRef.detach(); //only detach. not destroy
            }
            let outputData = componentInstance.outputData;
            if (outputData) {
                switch (outputData.action){
                    case "selected":
                        if (this.arrayFields.some(x=>x[0] == fieldName)) {
                            this.detail[fieldName]['selection'].push( outputData.value);
                            
                            let values = [];
                            if (this.detail[fieldName]['value']) values = this.detail[fieldName]['value'].split(' | ')
                            values.push(outputData.value.value); //display value
                            values = values.filter(x=>!!x);
                            this.detail[fieldName]['value'] = values.join(' | ');
                        } else if (this.referenceFields.includes(fieldName)) {
                            this.detail[fieldName] = outputData.value;
                        }                    
                        //trigger extraInfo populate, once reference changed.
                        this.extraInfoPopulate();
                        break;
                    case "view":
                        this.onRefShow(fieldName, "select", outputData.value);//value is _id
                        break;
                    default:
                        break;
                }                
            }
        });
    }
}

