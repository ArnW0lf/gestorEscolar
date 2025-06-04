import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MainLayoutComponent } from './main-layout';
import { AuthService } from '../../auth/auth.service';

// MainLayoutComponent is standalone and imports its own Material modules (MatToolbarModule, MatIconModule, MatMenuModule, MatButtonModule)
// RouterTestingModule is needed for routerLink and routerLinkActive.

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const setupTestBed = (userRole: string | null) => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole', 'logout']);
    mockAuthService.getUserRole.and.returnValue(userRole);

    TestBed.configureTestingModule({
      imports: [
        MainLayoutComponent, // Standalone
        RouterTestingModule, // For routerLink, routerLinkActive
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    // Note: fixture.detectChanges() will be called in each test or describe block
    // to allow role changes to reflect before assertions.
  };

  it('should create', () => {
    setupTestBed(null);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('logout() method should call authService.logout()', () => {
    setupTestBed(null);
    fixture.detectChanges();
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should always display Home link', () => {
    setupTestBed(null); // Role doesn't matter for Home link
    fixture.detectChanges();
    const homeButton = fixture.debugElement.query(By.css('button[routerLink="/home"]'));
    expect(homeButton).toBeTruthy();
    expect(homeButton.nativeElement.textContent).toContain('Home');
  });

  describe('Admin User Navigation', () => {
    beforeEach(() => {
      setupTestBed('Admin');
      fixture.detectChanges();
    });

    it('should display Admin navigation links (Students, Teachers, Subjects) when user role is Admin', () => {
      const studentButton = fixture.debugElement.query(By.css('button[routerLink="/students"]'));
      const teacherButton = fixture.debugElement.query(By.css('button[routerLink="/teachers"]'));
      const subjectButton = fixture.debugElement.query(By.css('button[routerLink="/subjects"]'));

      expect(studentButton).toBeTruthy();
      expect(studentButton.nativeElement.textContent).toContain('Students');
      expect(teacherButton).toBeTruthy();
      expect(teacherButton.nativeElement.textContent).toContain('Teachers');
      expect(subjectButton).toBeTruthy();
      expect(subjectButton.nativeElement.textContent).toContain('Subjects');
    });

    it('should NOT display Grades link when user role is Admin', () => {
      const gradesButton = fixture.debugElement.query(By.css('button[routerLink="/grades"]'));
      expect(gradesButton).toBeFalsy();
    });
  });

  describe('Docente User Navigation', () => {
    beforeEach(() => {
      setupTestBed('Docente');
      fixture.detectChanges();
    });

    it('should display Grades link when user role is Docente', () => {
      const gradesButton = fixture.debugElement.query(By.css('button[routerLink="/grades"]'));
      expect(gradesButton).toBeTruthy();
      expect(gradesButton.nativeElement.textContent).toContain('Grades');
    });

    it('should NOT display Admin navigation links when user role is Docente', () => {
      const studentButton = fixture.debugElement.query(By.css('button[routerLink="/students"]'));
      const teacherButton = fixture.debugElement.query(By.css('button[routerLink="/teachers"]'));
      const subjectButton = fixture.debugElement.query(By.css('button[routerLink="/subjects"]'));

      expect(studentButton).toBeFalsy();
      expect(teacherButton).toBeFalsy();
      expect(subjectButton).toBeFalsy();
    });
  });

  describe('Other User Navigation (e.g., no specific role with links)', () => {
    beforeEach(() => {
      setupTestBed('SomeOtherRole'); // Or null
      fixture.detectChanges();
    });

    it('should NOT display Admin navigation links', () => {
      const studentButton = fixture.debugElement.query(By.css('button[routerLink="/students"]'));
      expect(studentButton).toBeFalsy();
    });

    it('should NOT display Grades link', () => {
      const gradesButton = fixture.debugElement.query(By.css('button[routerLink="/grades"]'));
      expect(gradesButton).toBeFalsy();
    });
  });
});
