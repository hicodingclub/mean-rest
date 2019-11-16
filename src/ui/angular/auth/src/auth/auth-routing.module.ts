import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthenticationComponent } from './auth.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ChangePassComponent } from './changepass/changepass.component';
import { ChangedPassComponent } from './changepass/changedpass.component';
import { FindPassComponent } from './findpass/findpass.component';
import { ResetPassComponent } from './changepass/resetpass.component';
import { CheckEmailComponent } from './findpass/checkemail.component';

const routes: Routes = [
  { path: 'auth', 
    component: AuthenticationComponent,
    children: [ 

                { path: "login",  component: LoginComponent },
                { path: 'register', component: RegisterComponent },
                { path: 'changepass', component: ChangePassComponent },
                { path: 'changedpass', component: ChangedPassComponent },
                { path: 'findpass', component: FindPassComponent },
                { path: 'reset', 
                  children: [{
                    path: '**',
                    component: ResetPassComponent,
                  }],
                },
                { path: 'checkemail', component: CheckEmailComponent },

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