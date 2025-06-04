import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login'; // Adjusted path if login.ts is directly in auth/login
import { AuthGuard } from './auth/auth.guard'; // Adjusted path if auth.guard.ts is directly in auth
import { HomeComponent } from './home/home'; // Adjusted path if home.ts is directly in home
import { MainLayoutComponent } from './layout/main-layout/main-layout'; // Adjusted path

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      {
        path: 'students',
        loadChildren: () => import('./students/students/students-module').then(m => m.StudentsModule),
        data: { expectedRole: 'Admin' } // Ensure AuthGuard handles this role-based access
      },
      {
        path: 'teachers',
        loadChildren: () => import('./teachers/teachers-module').then(m => m.TeachersModule),
        data: { expectedRole: 'Admin' } // Ensure AuthGuard handles this role-based access
      },
      {
        path: 'subjects',
        loadChildren: () => import('./subjects/subjects-module').then(m => m.SubjectsModule),
        data: { expectedRole: 'Admin' } // Ensure AuthGuard handles this role-based access
      },
      // Docente Routes
      {
        path: 'grades', // Base path for grade-related features
        loadChildren: () => import('./grades/grades-module').then(m => m.GradesModule),
        data: { expectedRole: 'Docente' } // Or a more generic role if students/parents also view grades via this module
      }
      // Future routes can be added here
    ]
  },
  { path: '**', redirectTo: '/login' } // Redirect undefined paths to login
];
