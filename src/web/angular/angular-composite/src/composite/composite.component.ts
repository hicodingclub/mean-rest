import { Component, Input, OnInit, AfterViewInit, ViewContainerRef,  Directive, ComponentFactoryResolver, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Injector, EventEmitter } from '@angular/core';

import { Location } from '@angular/common';

import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export type compositeSteps = {
    stepName: string,
    stepTitle: string,
    stepComponent: any, 
    mandatory: boolean,

    // for list selection
    preSelectedId: string,
    multiSelect: boolean,
    // for detail view
    disableActionButtions: boolean,

    // both list and detail
    searchObj: any,

    submitFieldName: string, //mapping to the field in submit components

    errorMessage: string, //messages for possible error
}[];
export type submitComponent = {
    compoment: any,
    succeedUrl: string,
    cancelUrl: string,
    requireConfirm: boolean,
}

@Directive({
    selector: '[composite-directive]',
})
export class CompositeDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Directive({
    selector: '[composite-submit-directive]',
})
export class CompositeSubmitDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'app-composite',
    templateUrl: 'composite.component.html',
    styleUrls: ['composite.component.css'],
})
export class CompositeComponent implements OnInit, AfterViewInit{
    @Input()
    public steps: compositeSteps;
    @Input()
    public title: string;
    @Input()
    public submit: submitComponent;

    public totalSteps: number = 0;
    public stepCompRef = [];
    public stepCompIns = [];
    public submitCompRef;
    public errorMessages: boolean[] = [];
    public submitting = false;

    @ViewChildren(CompositeDirective)
    compositeDirectives: QueryList<CompositeDirective>;
    @ViewChild(CompositeSubmitDirective)
    compositeSubmitDirective: CompositeSubmitDirective;

    constructor(
        public componentFactoryResolver: ComponentFactoryResolver,
        public router: Router) {
    }

    ngOnInit() {
        if (!this.steps) {
            console.warn("No steps defined for CompositeComponent.");
            return;
        }
        this.totalSteps = this.steps.length;
    }

    ngAfterViewInit() {
        if (!this.compositeDirectives) {
            console.warn("No composite directive for CompositeComponent.");
            return;
        }
        setTimeout(() => { //using a timer to trigger view changes in next round of change detection turn. Privent ExpressionChangedAfterItHasBeenCheckedError
            this.loadAllSteps();
        }, 10);
    }

    loadAllSteps() {
        this.compositeDirectives.forEach((directive, index, array) => {
            const { stepTitle, stepComponent, mandatory, preSelectedId, searchObj, disableActionButtions} = this.steps[index];

            let viewContainerRef = directive.viewContainerRef;
            viewContainerRef.clear();
    
            let componentRef = this.stepCompRef[index]; // check if it is created already
            if (!componentRef) {
                let componentFactory = this.componentFactoryResolver.resolveComponentFactory(stepComponent);
                componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call
                this.stepCompRef[index] = componentRef; // save it
            } else {
                viewContainerRef.insert(componentRef.hostView);
            }
    
            let componentInstance = componentRef.instance;
            this.stepCompIns[index] = componentInstance;

            componentInstance.inputData = {
                stepTitle,
                preSelectedId,
                mandatory,
            };
            componentInstance.searchObj = searchObj;
            componentInstance.disableActionButtions = disableActionButtions;
            if (index === 0) {
                componentInstance.setFocus();
            }
        });
    }

    allActionsReady(): boolean {
        let ready = true;
        for(let [index, step] of this.steps.entries()) {
            this.errorMessages[index] = false; // no error
            if (step.mandatory) {
                const instance = this.stepCompIns[index];
                if (instance.actionType === 'selection') {
                    let value = instance.getSelectedItems();
                    if (value.length === 0) {
                        this.errorMessages[index] = true;
                        ready = false;
                    }
                } else if (instance.actionType === 'term') {
                    if(!instance.isTermChecked()) {
                        this.errorMessages[index] = true;
                        ready = false;
                    }
                }
            }
        }
        return ready;
    }

    onSubmit() {
        this.submitting = true;
        if (!(this.allActionsReady())) {
            return;
        }
        let viewContainerRef = this.compositeSubmitDirective.viewContainerRef;
        viewContainerRef.clear();

        if (!this.submitCompRef) {
            let componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.submit.compoment);
            this.submitCompRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call
        }
        let componentInstance = this.submitCompRef.instance;
        const initData = {};
        for(let [index, step] of this.steps.entries()) {
            const instance = this.stepCompIns[index];
            let value;
            if (instance.actionType === 'selection') {
                value = instance.getSelectedItems();
                if (value.length === 0) {
                    value = undefined;
                } else if (!componentInstance.arrayFields.some(x=>x[0]===step.submitFieldName)) { //check if the target fields is an array fields. in ['fieldName', 'Field type'] format
                    value = value[0]; //only get one object
                }
            } else if (instance.actionType === 'term') {
                value = instance.isTermChecked();
            }
            initData[step.submitFieldName] = value;
        }
        componentInstance.id = undefined;
        componentInstance.embeddedView = true;
        componentInstance.initData = initData;
        componentInstance.ngOnInit();
        componentInstance.onSubmit();
        componentInstance.done.subscribe((value) => {
            if (value) {
                this.router.navigateByUrl(this.submit.succeedUrl);
            }
        });
    }

    onCancel() {
        this.router.navigateByUrl(this.submit.cancelUrl);
    }
}
