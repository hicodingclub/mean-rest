import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AuthenticationService } from '../auth.service';


@Component(
    {templateUrl: 'findpass.component.html',
     styleUrls: ['findpass.component.css']
    })
export class FindPassComponent implements OnInit {
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
            email: ['', [Validators.email, Validators.required]],
        });
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

        this.authenticationService.findPass(o)
            .pipe(first())
            .subscribe(
                data => {
                    this.servererror = false;
                    this.loading = false;
                    this.router.navigate(['../checkemail'], {relativeTo: this.route});
                },
                error => {
                    this.servererror = true;
                    this.serverText = error.error.error;
                    this.serverText = this.serverText.replace('muser', 'User');
                    this.loading = false;
                });
    }
}
