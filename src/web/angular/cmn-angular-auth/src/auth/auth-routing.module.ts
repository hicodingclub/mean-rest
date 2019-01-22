import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticationComponent } from './auth.component';
import { LoginComponent } from './login';
import { RegisterComponent } from './register';

const routes: Routes = [
  { path: 'auth', 
    component: AuthenticationComponent,
    children: [ 

                { path: "login",  component: LoginComponent },
                { path: 'register', component: RegisterComponent },

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