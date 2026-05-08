import { Routes } from '@angular/router';

export const hearingsRoutes: Routes = [
  { path: '', loadComponent: () => import('./hearings-list.component').then(m => m.HearingsListComponent) },
  { path: 'new', loadComponent: () => import('./hearing-form.component').then(m => m.HearingFormComponent) },
  { path: ':id', loadComponent: () => import('./hearing-detail.component').then(m => m.HearingDetailComponent) },
];
