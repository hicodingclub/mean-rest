import {
    Component, Directive,
    Input, Output,
    OnInit, AfterViewInit,
    ViewContainerRef, ViewChildren, ViewChild,
    ComponentFactoryResolver, QueryList,
    EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';

export interface CompositeStep {
    stepName: string;
    errorMessage: string; // messages for possible error
}
export interface CompositeStepConfig {
    stepTitle: string;

    stepComponent: any;
    mandatory: boolean;

    // for list selection
    preSelectedId: string;
    multiSelect: boolean;
    // for detail view
    options: any;

    // both list and detail
    id: string;
    searchObj: any;

    submitFieldName: string; // mapping to the field in submit components
}
export interface SubmitComponent {
    compoment: any;
    succeedUrl: string;
    cancelUrl: string;
    requireConfirm: boolean;
}

@Directive({
    selector: '[libComposite]',
})
export class CompositeDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Directive({
    selector: '[libCompositeSubmit]',
})
export class CompositeSubmitDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    selector: 'lib-composite',
    templateUrl: 'composite.component.html',
    styleUrls: ['composite.component.css'],
})
export class CompositeComponent implements OnInit, AfterViewInit {
    @Input()
    public steps: CompositeStep[];
    @Input()
    public stepConfigs: CompositeStepConfig[];
    @Input()
    public title: string;
    @Input()
    public submit: SubmitComponent;

    public totalSteps = 0;
    public stepCompRef = [];
    public stepCompIns = [];
    public stepCompEmitter = [];
    public submitCompRef;
    public errorMessages: boolean[] = [];
    public submitting = false;

    @Output()
    public componentEvents = new EventEmitter<any>();

    @ViewChildren(CompositeDirective)
    compositeDirectives: QueryList<CompositeDirective>;
    @ViewChild(CompositeSubmitDirective, {static: true})
    compositeSubmitDirective: CompositeSubmitDirective;

    constructor(
        public componentFactoryResolver: ComponentFactoryResolver,
        public router: Router) {
    }

    ngOnInit() {
        if (!this.steps) {
            console.warn('No steps defined for CompositeComponent.');
            return;
        }
        this.totalSteps = this.steps.length;
    }

    ngAfterViewInit() {
        if (!this.compositeDirectives) {
            console.warn('No composite directive for CompositeComponent.');
            return;
        }

        setTimeout(() => {
            // using a timer to trigger view changes in next round of change detection turn.
            // Privent ExpressionChangedAfterItHasBeenCheckedError
            this.loadAllSteps();
        }, 10);

        this.componentEvents.emit({ // telling parent we are ready to load steps
            stepIndex: undefined,
            message: {
                type: 'ngAfterViewInit'
            },
        });
    }

    reloadStep(index: number, stepConfig: CompositeStepConfig) {
        const directive = this.compositeDirectives.toArray()[index];
        const { stepTitle, stepComponent, mandatory, preSelectedId, id, searchObj, options} = stepConfig;

        if (!stepComponent) { return; } // stop handling this step.

        const viewContainerRef = directive.viewContainerRef;
        viewContainerRef.clear();

        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(stepComponent);
        const componentRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call

        const componentInstance: any = componentRef.instance;
        this.stepCompIns[index] = componentInstance;

        componentInstance.inputData = {
            stepTitle,
            preSelectedId,
            mandatory,
        };
        if (id) {
            componentInstance.id = id;
        }
        if (searchObj) {
            componentInstance.searchObj = searchObj;
        }
        if (options) {
            componentInstance.options = options;
        }
        if (index === 0) {
            componentInstance.setFocus();
        }
        componentInstance.eventEmitter.subscribe((message) => {
            if (message) {
                const msg = {
                    stepIndex: index,
                    message,
                };
                this.componentEvents.emit(msg);
            }
        });
    }

    loadAllSteps() {
        for (let index = 0; index < this.compositeDirectives.length; index++) {
            if (this.stepCompIns[index]) { continue; } // already loaded
            if (!this.stepConfigs[index]) { continue; } // no configuration
            this.reloadStep(index, this.stepConfigs[index]);
        }
    }

    allActionsReady(): boolean {
        let ready = true;
        for (const [index, step] of this.stepConfigs.entries()) {
            this.errorMessages[index] = false; // no error
            if (step.mandatory) {
                const instance = this.stepCompIns[index];
                if (!instance) {
                    return false;
                }
                if (instance.actionType === 'selection') {
                    const value = instance.getSelectedItems();
                    if (value.length === 0) {
                        this.errorMessages[index] = true;
                        ready = false;
                        return false;
                    }
                } else if (instance.actionType === 'term') {
                    if (!instance.isTermChecked()) {
                        this.errorMessages[index] = true;
                        return false;
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
        const viewContainerRef = this.compositeSubmitDirective.viewContainerRef;
        viewContainerRef.clear();

        if (!this.submitCompRef) {
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.submit.compoment);
            this.submitCompRef = viewContainerRef.createComponent(componentFactory); // create and insert in one call
        }
        const componentInstance = this.submitCompRef.instance;
        const initData = {};
        for (const [index, step] of this.stepConfigs.entries()) {
            const instance = this.stepCompIns[index];
            let value;
            if (instance.actionType === 'selection') {
                value = instance.getSelectedItems();
                if (value.length === 0) {
                    value = undefined;
                } else if (!componentInstance.arrayFields.some(x => x[0] === step.submitFieldName)) {
                    // check if the target fields is an array fields. in ['fieldName', 'Field type'] format
                    value = value[0]; // only get one object
                }
            } else if (instance.actionType === 'term') {
                value = instance.isTermChecked();
            } else { // details?
                value = instance.detail._id;
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
