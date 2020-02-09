import { Component, AfterViewInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from '../auth.service';

@Component(
    {templateUrl: 'register-verify.component.html',
     styleUrls: ['register.component.css']
    })
export class RegisterVerifyComponent implements AfterViewInit {
    verificationSucc: boolean = false;
    loading: boolean = true;
    serverText: string = '';

    timeleft = 10;
    countDownTimer = null;

    constructor(
        private authenticationService: AuthenticationService,
        private router: Router,
        private route: ActivatedRoute,
        ) { }

    ngAfterViewInit(): void {
        const url = this.router.url;

        const verificationToken = url.substring(url.lastIndexOf('/') + 1);
        this.authenticationService.regVerification({verificationToken})
        .pipe(first())
        .subscribe(
            data => {
                this.verificationSucc = true;
                this.loading = false;
                this.countDownTimer = setInterval(() => {
                    this.timeleft -= 1;
                    if(this.timeleft <= 0){
                      this.goLogin();
                    }
                }, 1000);
            },
            error => {
                this.verificationSucc = false;
                this.serverText = error.error.error;
                this.loading = false;
            });
    }
    goLogin() {
        clearInterval(this.countDownTimer);
        this.router.navigate(['../../login'], {relativeTo: this.route, });
    }
}
