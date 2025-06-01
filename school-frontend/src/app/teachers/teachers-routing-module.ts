import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TeacherListComponent } from './teacher-list/teacher-list'; // Adjusted path
import { TeacherFormComponent } from './teacher-form/teacher-form'; // Adjusted path

const routes: Routes = [
  { path: '', component: TeacherListComponent },
  { path: 'new', component: TeacherFormComponent, data: { mode: 'new' } },
  { path: 'edit/:id', component: TeacherFormComponent, data: { mode: 'edit' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeachersRoutingModule { }
