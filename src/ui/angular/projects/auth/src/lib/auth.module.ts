import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthRoutingModule } from './auth-routing.module';
import { AuthenticationService } from './auth.service';
import { TokenInterceptor } from './auth.interceptor';
import { AuthenticationComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RegisterVerifyComponent } from './register/register-verify.component';
import { ProfileComponent } from './register/profile.component';
import { ChangePassComponent } from './changepass/changepass.component';
import { ResetPassComponent } from './changepass/resetpass.component';
import { ChangedPassComponent } from './changepass/changedpass.component';
import { FindPassComponent } from './findpass/findpass.component';
import { CheckEmailComponent } from './findpass/checkemail.component';
import { AuthGuard } from './auth.guard';
import { AuthIconComponent } from './auth-icon/auth-icon.component';
import { ClickElsewhereDirective } from './auth-icon/click-elsewhere.directive';

import { MddsUiRoleCheckDirective } from './ui-role.directives';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        AuthRoutingModule
    ],
    declarations: [
        AuthenticationComponent,
        LoginComponent,
        RegisterComponent,
        RegisterVerifyComponent,
        ProfileComponent,
        ChangePassComponent,
        ResetPassComponent,
        ChangedPassComponent,
        FindPassComponent,
        CheckEmailComponent,
        AuthIconComponent,

        ClickElsewhereDirective,
        MddsUiRoleCheckDirective,
    ],
    exports: [
        AuthIconComponent,
        MddsUiRoleCheckDirective,
    ],
    providers: [
        AuthGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: TokenInterceptor,
            multi: true
        },
    ]
})
export class AuthenticationModule {}
