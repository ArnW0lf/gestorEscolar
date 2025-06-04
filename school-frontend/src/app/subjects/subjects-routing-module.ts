import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SubjectListComponent } from './subject-list/subject-list'; // Adjusted
import { SubjectFormComponent } from './subject-form/subject-form'; // Adjusted

const routes: Routes = [
  { path: '', component: SubjectListComponent },
  { path: 'new', component: SubjectFormComponent, data: { mode: 'new' } },
  { path: 'edit/:id', component: SubjectFormComponent, data: { mode: 'edit' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule] 
})
export class SubjectsRoutingModule { }
