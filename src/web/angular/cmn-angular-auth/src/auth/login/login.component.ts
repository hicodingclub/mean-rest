import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AuthenticationService } from '../auth.service';

@Component(
    {templateUrl: 'login.component.html',
     styleUrls: ['login.component.css']
    })
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    submitted = false;
    servererror = false;
    serverText = '';
    returnUrl: string;
  
    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService) { }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        // reset login status
        this.authenticationService.logout();

        // get return url from route parameters or default to '/'
        // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }
        let returnUrl = this.authenticationService.getInterruptedUrl();
        if (this.router.url === returnUrl) { returnUrl = '/'; } // home page

        this.loading = true;
        this.authenticationService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.servererror = false;
                    this.router.navigate([returnUrl]);
                    this.loading = false;
                },
                error => {
                    // this.alertService.error(error);
                    this.servererror = true;
                    this.serverText = error.error.error;
                    this.loading = false;
                });
    }

    cancel() {
      const routedFromUrl = this.authenticationService.getRoutedFromUrl();
      this.router.navigate([routedFromUrl]);
    }
}
