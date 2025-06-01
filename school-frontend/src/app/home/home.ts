import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service'; // Correct path
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true, // Already set
  imports: [         // Already populated
    CommonModule,
    MatCardModule
  ],
  templateUrl: './home.html', // Original: ./home.component.html
  styleUrls: ['./home.scss']  // Original: ./home.component.scss
})
export class HomeComponent implements OnInit {
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
  }
}
