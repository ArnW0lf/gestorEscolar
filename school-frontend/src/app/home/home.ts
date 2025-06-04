import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  userRole: string | null = null;
  tokenError: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    try {
      this.userRole = this.authService.getUserRole();
      this.authService.debugToken(); // Para depuración
      
      if (!this.userRole) {
        this.tokenError = 'El token no contiene información de rol';
      }
    } catch (error) {
      this.tokenError = 'Error al decodificar el token';
      console.error('Error:', error);
    }
  }
}