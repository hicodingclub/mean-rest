﻿import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticationComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ChangePassComponent } from './changepass/changepass.component';
import { ChangedPassComponent } from './changepass/changedpass.component';

const routes: Routes = [
  { path: 'auth', 
    component: AuthenticationComponent,
    children: [ 

                { path: "login",  component: LoginComponent },
                { path: 'register', component: RegisterComponent },
                { path: 'changepass', component: ChangePassComponent },
                { path: 'changedpass', component: ChangedPassComponent },

                { path: '',  redirectTo: 'login', pathMatch: 'full' },
                { path: '**', redirectTo: 'login' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }