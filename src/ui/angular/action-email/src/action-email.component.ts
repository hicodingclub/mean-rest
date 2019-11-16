import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { ActionBase } from 'mdds-angular-action-base';

const validateInputs = function(form) {
    const emailInput = form.controls.emailInput.value
    const emailTemplate = form.controls.emailTemplate.value;
    const subject = form.controls.subject.value;
    const content = form.controls.content.value;

    // clear errors
    form.controls.subject.setErrors(null);
    form.controls.content.setErrors(null);
    if (emailInput == 'template') {
        if (!emailTemplate) {
            form.controls.emailTemplate.setErrors({'required': true});
        }
    } else if (emailInput == 'compose') {
        if (!subject) {
            form.controls.subject.setErrors({'required': true});
        }
        if (!content) {
            form.controls.content.setErrors({'required': true});
        }
    }
    return null;
};

@Component({
    selector: 'mdds-action-email',
    templateUrl: 'action-email.component.html',
    styleUrls: ['action-email.component.css']
})
export class ActionEmail extends ActionBase implements OnInit {
    showDialog = false;
    showTemplate = true;
    emailForm: FormGroup;
    submitted = false;
    emailData = {};

    constructor(
        private formBuilder: FormBuilder
        ) {
            super();
        }


    ngOnInit() {
        this.emailForm = this.formBuilder.group({
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
        })
    }

    buttonClicked() {
        this.showDialog = true;
        this.submitted = false;
    }

    // convenience getter for easy access to form fields
    get f() { return this.emailForm.controls; }

    onSubmit() {
        this.submitted = true;
        // stop here if form is invalid
        if (this.emailForm.invalid) {
            return;
        }

        // { actionType, actionData, succMessage} 
        // actionData: {emailInput: , emailTemplate, subject, content}
        this.emitEvent({
            actionType: "emailing",
            actionData: this.emailData,
            succMessage: "Email sent!"
        });
        this.showDialog = false;
    }
    cancel() {
        this.showDialog = false;
    }
}
