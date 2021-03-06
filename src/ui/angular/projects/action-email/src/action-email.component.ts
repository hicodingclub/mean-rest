import { Component, OnInit, OnChanges, Input } from '@angular/core';

import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';

import { ActionBase } from '@hicoder/angular-action-base';

const validateInputs = (form) => {
    const emailFields = form.controls.emailFields.value; // [true, false, ...] checked box
    const emailInput = form.controls.emailInput.value;
    const emailTemplate = form.controls.emailTemplate.value;
    const subject = form.controls.subject.value;
    const content = form.controls.content.value;

    // clear errors
    form.controls.emailFields.setErrors(null);
    form.controls.subject.setErrors(null);
    form.controls.content.setErrors(null);
    form.controls.emailTemplate.setErrors(null);

    if (emailFields.length > 0 && !emailFields.includes(true)) {
        form.controls.emailFields.setErrors({required: true});
    }
    if (emailInput === 'template') {
        if (!emailTemplate) {
            form.controls.emailTemplate.setErrors({required: true});
        }
    } else if (emailInput === 'compose') {
        if (!subject) {
            form.controls.subject.setErrors({required: true});
        }
        if (!content) {
            form.controls.content.setErrors({required: true});
        }
    }
    return null;
};

@Component({
    selector: 'lib-mdds-action-email',
    templateUrl: 'action-email.component.html',
    styleUrls: ['action-email.component.css']
})
export class ActionEmailComponent extends ActionBase implements OnInit, OnChanges {
    @Input() emailFields = [];
    @Input() recordNumber: number = 0;
    @Input() stringFields: string[] = [];

    recipientNumber: number = 0;

    showDialog = false;
    showTemplate = true;
    emailForm: FormGroup;
    submitted = false;
    emailData: any;

    constructor(
        private formBuilder: FormBuilder
        ) {
            super();
        }

    ngOnInit() {
        const emailCheckboxArray = new FormArray([]);
        for (let i = 0; i < this.emailFields.length; i++) {
            const t = i == 0 ? true : false;
            emailCheckboxArray.push(new FormControl(t));
        }
        this.emailForm = this.formBuilder.group({
            emailFields: emailCheckboxArray,
            emailInput: ['template', [Validators.required]],
            emailTemplate: ['', []],
            subject: ['', []],
            content: ['', []],
        }, {validator: validateInputs });

        this.emailForm.valueChanges.subscribe((data) => {
            this.submitted = false;
            if (data.emailInput === 'template') {
                this.showTemplate = true;
            } else {
                this.showTemplate = false;
            }
            this.emailData = data;
            const emailFields = [];
            for (let i = 0; i < this.emailFields.length; i++) {
                if (data.emailFields[i]) {
                    emailFields.push(this.emailFields[i][1]);
                }
            }
            this.emailData.emailFields = emailFields;
            this.recipientNumber = this.recordNumber * emailFields.length;
        });

        this.recipientNumber = this.recordNumber * 1;
    }

    ngOnChanges(data) {
        this.recipientNumber = this.recordNumber * 1;
    }

    buttonClicked() {
        this.showDialog = true;
        this.submitted = false;
    }

    // convenience getter for easy access to form fields
    get f() { return this.emailForm.controls; }

    get ec() {
        const emailFields = this.emailForm.controls.emailFields as FormArray;
        return emailFields.controls;
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.emailForm.invalid) {
            return;
        }

        // { actionType, actionData, succMessage}
        // actionData: {emailInput: , emailTemplate, subject, content}
        this.emitEvent({
            actionType: 'emailing',
            actionData: this.emailData,
            succMessage: 'Email processed!',
            resultFields: ['success', 'fail', 'queuing'],
        });
        this.showDialog = false;
    }
    cancel() {
        this.showDialog = false;
    }
}
