import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../auth.service';

const validatePasswords = function(form) {
    const passwordConf = form.controls.password_conf.value;
    const password = form.controls.newPassword.value;

    if (passwordConf === password) {
        return null;
    } else {
        form.controls.password_conf.setErrors({'passwordNotSame': true});
        return null;
    }
};

@Component(
    {templateUrl: 'resetpass.component.html',
     styleUrls: ['changepass.component.css']
    })
export class ResetPassComponent implements OnInit {
    form: FormGroup;
    loading: boolean = false;
    submitted: boolean = false;
    servererror = false;
    success: boolean = false;
    serverText: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private authenticationService: AuthenticationService
        ) { }


    ngOnInit() {
        this.form = this.formBuilder.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            password_conf: ['', [Validators.required, Validators.minLength(6)]]
        }, {validator: validatePasswords });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        const values = this.form.value;
        const o = {};
        for (let p in values) { // remove empty string
            if (!!values[p]) {
                o[p] = values[p];
            }
        }
        const url = this.router.url;
        const resetToken = url.substring(url.lastIndexOf('/') + 1);
        o['resetToken'] = resetToken;

        this.authenticationService.changePass(o)
            .pipe(first())
            .subscribe(
                data => {
                    this.servererror = false;
                    this.loading = false;
                    this.router.navigate(['../../changedpass'], {relativeTo: this.route});
                },
                error => {
                    this.servererror = true;
                    this.serverText = error.error.error;
                    this.serverText = this.serverText.replace('muser', 'User');
                    this.loading = false;
                });
    }
}
