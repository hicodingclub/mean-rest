import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthRoutingModule } from './auth-routing.module';
import { AuthenticationService } from './auth.service';
import { TokenInterceptor } from './auth.interceptor';
import { AuthenticationComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ChangePassComponent } from './changepass/changepass.component';
import { ChangedPassComponent } from './changepass/changedpass.component';
import { AuthGuard } from './auth.guard';
import { AuthIconComponent } from './auth-icon/auth-icon.component';
import { ClickElsewhereDirective } from './auth-icon/click-elsewhere.directive';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,

        AuthRoutingModule
    ],
    declarations: [
        AuthenticationComponent,
        LoginComponent,
        RegisterComponent,
        ChangePassComponent,
        ChangedPassComponent,
        AuthIconComponent,

        ClickElsewhereDirective
    ],
    exports: [
        AuthIconComponent
    ],
    providers: [
        AuthenticationService,
        AuthGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
    ]
})
export class AuthenticationModule{}
