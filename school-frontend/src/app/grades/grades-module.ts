import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { GradesRoutingModule } from './grades-routing-module'; // Adjusted
import { GradeFormComponent } from './grade-form/grade-form'; // Adjusted
// import { GradeListComponent } from './grade-list/grade-list.component'; // If you add it

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon'; // Optional, for icons
import { MatTooltipModule } from '@angular/material/tooltip'; // Optional

@NgModule({
  declarations: [
    // GradeListComponent
  ],
  imports: [
    CommonModule,
    GradesRoutingModule, // Corrected variable name
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    GradeFormComponent
  ]
})
export class GradesModule { }
