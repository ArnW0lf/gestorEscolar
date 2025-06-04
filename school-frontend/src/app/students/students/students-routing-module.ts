import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentListComponent } from './student-list/student-list'; // Adjusted path
import { StudentFormComponent } from './student-form/student-form'; // Adjusted path
// import { StudentDetailComponent } from './student-detail/student-detail.component';

const routes: Routes = [
  { path: '', component: StudentListComponent },
  { path: 'new', component: StudentFormComponent, data: { mode: 'new' } }, // For creating a new student
  { path: 'edit/:id', component: StudentFormComponent, data: { mode: 'edit' } }, // For editing an existing student
  // { path: ':id', component: StudentDetailComponent }, // For viewing details
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StudentsRoutingModule { }
