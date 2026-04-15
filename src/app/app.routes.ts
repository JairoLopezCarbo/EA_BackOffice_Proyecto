import { Routes } from '@angular/router';
import { DataManagerPage } from './features/data-manager/pages/data-manager-page/data-manager-page';
import { LoginPage } from './features/auth/pages/login-page/login-page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: '',
    component: DataManagerPage
  },
  {
    path: 'login',
    component: LoginPage
  },
];