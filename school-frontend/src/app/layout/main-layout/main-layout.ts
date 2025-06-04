import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service'; // Correct path
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-main-layout',
  standalone: true, // Already set
  imports: [         // Already populated, ensuring all are here
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './main-layout.html', // Original: ./main-layout.component.html
  styleUrls: ['./main-layout.scss']  // Original: ./main-layout.component.scss
})
export class MainLayoutComponent {
  constructor(private authService: AuthService) {}

  public get userRole(): string | null {
    return this.authService.getUserRole();
  }

  logout(): void {
    this.authService.logout();
  }
}
