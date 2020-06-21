import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../auth.service';
import { AUTHENTICATION_REGISTRATION_REQUIRED } from '../tokens';

@Component(
    {templateUrl: 'profile.component.html',
     styleUrls: ['register.component.css', 'profile.component.css']
    })
export class ProfileComponent implements OnInit {
    registerForm: FormGroup;
    loading = false;
    submitted = false;
    servererror = false;
    serverText = '';

    showProfile: boolean = true;
    profile: any = {};

    registrationSucc = false;
    email: string;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService,
        @Inject(AUTHENTICATION_REGISTRATION_REQUIRED) public regRequired: any,
        ) { }


    ngOnInit() {
        this.loading = true;
        this.authenticationService.getProfile()
        .pipe(first())
        .subscribe(
            data => {
                this.profile = data;
                this.loading = false;
            },
            error => {
                this.servererror = true;
                this.serverText = error.error.error;
                this.serverText = this.serverText.replace('muser', 'User');
                this.loading = false;
            }
        );
    }

    // convenience getter for easy access to form fields
    get f() { return this.registerForm.controls; }

    onEdit() {
        const phoneNumber = /^(\d+-?)+\d+$/;

        const firstNameValidators = [];
        const lastNameValidators = [];
        const phoneValidators = [Validators.pattern(phoneNumber)];
        if (typeof this.regRequired === 'object' ) {
            if (this.regRequired.firstName) {
                firstNameValidators.push(Validators.required);
            }
            if (this.regRequired.lastName) {
                lastNameValidators.push(Validators.required);
            }
            if (this.regRequired.phone) {
                phoneValidators.push(Validators.required);
            }
        }

        this.registerForm = this.formBuilder.group({
            firstname: [this.profile.firstname, firstNameValidators],
            lastname: [this.profile.lastname, lastNameValidators],
            phone: [this.profile.phone, phoneValidators],
        }, {});

        this.showProfile = false;
    }
    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        const values = this.registerForm.value;
        const o = {};
        for (let p in this.profile) { // remove empty string
            if (!!this.profile[p]) {
                o[p] = this.profile[p];
            }
        }
        for (let p in values) { // remove empty string
            if (!!values[p]) {
                o[p] = values[p];
            }
            if (!values[p]) {
                delete o[p];
            }
        }
        this.authenticationService.updateProfile(o)
            .pipe(first())
            .subscribe(
                data => {
                    this.profile = data;
                    this.servererror = false;
                    this.serverText = '';
                    this.loading = false;
                    this.showProfile = true;
                },
                error => {
                    // this.alertService.error(error);
                    // alert("Error login");
                    this.servererror = true;
                    this.serverText = error.error.error;
                    this.serverText = this.serverText.replace('muser', 'User');
                    this.loading = false;
                });
    }
    cancelEdit() {
        this.servererror = false;
        this.serverText = '';
        this.loading = false;
        this.showProfile = true;
    }
}
