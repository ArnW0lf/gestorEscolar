import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GradeFormComponent } from './grade-form/grade-form'; // Adjusted path
// import { GradeListComponent } from './grade-list/grade-list.component';

const routes: Routes = [
  { path: 'record', component: GradeFormComponent }, // Route for docentes to record grades
  // { path: '', component: GradeListComponent }, // Default to listing grades for the user (teacher/student)
  // { path: 'student/:studentId', component: GradeListComponent }, // View grades for a specific student (admin/teacher)
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GradesRoutingModule { }
