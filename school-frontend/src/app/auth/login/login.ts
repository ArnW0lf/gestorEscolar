import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'; // Added FormsModule, ReactiveFormsModule
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common'; // For *ngIf
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true, // Was already made standalone
  imports: [
    CommonModule,
    FormsModule, // Added
    ReactiveFormsModule, // Added
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.html', // Original was ./login.component.html
  styleUrls: ['./login.scss']  // Original was ./login.component.scss
})
export class LoginComponent { // Class name is already LoginComponent
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]], // Assuming username is email
      password: ['', Validators.required]
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']); // Or to a dashboard
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.errorMessage = null;
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/home']); // Navigate to a protected route
        },
        error: (err) => {
          this.errorMessage = 'Login failed. Please check your credentials.';
          if (err.error && typeof err.error.detail === 'string') {
             this.errorMessage = err.error.detail;
          } else if (err.status === 0) {
            this.errorMessage = 'Could not connect to the server. Please try again later.';
          }
          console.error('Login error:', err);
        }
      });
    } else {
      this.errorMessage = 'Please enter valid credentials.';
    }
  }
}
