import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../auth.service';

const validatePasswords = (form) => {
    const passwordConf = form.controls.password_conf.value;
    const password = form.controls.password.value;

    if (passwordConf === password) {
        return null;
    } else {
        form.controls.password_conf.setErrors({passwordNotSame: true});
        return null;
    }
};

@Component(
    {templateUrl: 'register.component.html',
     styleUrls: ['register.component.css']
    })
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    loading = false;
    submitted = false;
    servererror = false;
    serverText = '';

    registrationSucc = false;
    email: string;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService
        ) { }


    ngOnInit() {
        const phoneNumber = /^(\d+-?)+\d+$/;
        const userName = /^[A-Za-z]((?!(@)).)*$/;
        this.registerForm = this.formBuilder.group({
            username: ['', [Validators.pattern(userName), Validators.required]],
            email: ['', [Validators.email, Validators.required]],
            phone: ['', Validators.pattern(phoneNumber)],
            password: ['', [Validators.required, Validators.minLength(6)]],
            password_conf: ['', [Validators.required, Validators.minLength(6)]]
        }, {validator: validatePasswords });
    }

    // convenience getter for easy access to form fields
    get f() { return this.registerForm.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        const values = this.registerForm.value;
        const o = {};
        for (let p in values) { // remove empty string
            if (!!values[p]) {
                o[p] = values[p];
            }
        }
        this.authenticationService.register(o)
            .pipe(first())
            .subscribe(
                data => {
                    this.servererror = false;
                    if (!data.registrationEmailVerification) {
                        // this.alertService.success('Registration successful', true);
                        this.router.navigate(['../login'], {relativeTo: this.route, });
                        return;
                    }
                    this.registrationSucc = true;
                    this.email = this.registerForm.controls.email.value;
                    
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
    cancel() {
      const routedFromUrl = this.authenticationService.getRoutedFromUrl();
      this.router.navigateByUrl(routedFromUrl);
    }
}
