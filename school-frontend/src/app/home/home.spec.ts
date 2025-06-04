import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing'; // For routerLink
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HomeComponent } from './home';
import { AuthService } from '../auth/auth.service';
import { StudentService } from '../services/student.service';
import { TeacherService } from '../services/teacher.service';
import { SubjectService } from '../services/subject.service';

// Material Modules are imported by HomeComponent as it's standalone
// We need RouterTestingModule for routerLink directives in the template.

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockStudentService: jasmine.SpyObj<StudentService>;
  let mockTeacherService: jasmine.SpyObj<TeacherService>;
  let mockSubjectService: jasmine.SpyObj<SubjectService>;

  const setupTestBed = (userRole: string | null) => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole', 'logout']); // Added logout just in case
    mockAuthService.getUserRole.and.returnValue(userRole);

    mockStudentService = jasmine.createSpyObj('StudentService', ['getStudents']);
    mockTeacherService = jasmine.createSpyObj('TeacherService', ['getTeachers']);
    mockSubjectService = jasmine.createSpyObj('SubjectService', ['getSubjects']);

    TestBed.configureTestingModule({
      imports: [
        HomeComponent, // HomeComponent is standalone, imports its own Material modules
        RouterTestingModule, // For routerLink
        NoopAnimationsModule // For Material animations
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: StudentService, useValue: mockStudentService },
        { provide: TeacherService, useValue: mockTeacherService },
        { provide: SubjectService, useValue: mockSubjectService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  };

  describe('Admin User', () => {
    beforeEach(() => {
      setupTestBed('Admin');
    });

    it('isLoading should be true initially when role is Admin, then false after data load', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(of({ totalItems: 10, data: [] }));
      mockTeacherService.getTeachers.and.returnValue(of({ totalItems: 5, data: [] }));
      mockSubjectService.getSubjects.and.returnValue(of({ totalItems: 3, data: [] }));

      expect(component.isLoading).toBe(true); // Should be true before ngOnInit runs fully
      fixture.detectChanges(); // Trigger ngOnInit
      expect(component.isLoading).toBe(true); // Still true as promises are resolving

      tick(); // Resolve all promises
      fixture.detectChanges(); // Update view with new data

      expect(component.isLoading).toBe(false);
    }));

    it('should call getStudents, getTeachers, getSubjects on init for Admin', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(of({ totalItems: 0, data: [] }));
      mockTeacherService.getTeachers.and.returnValue(of({ totalItems: 0, data: [] }));
      mockSubjectService.getSubjects.and.returnValue(of({ totalItems: 0, data: [] }));

      fixture.detectChanges(); // ngOnInit
      tick(); // Complete observables

      expect(mockStudentService.getStudents).toHaveBeenCalled();
      expect(mockTeacherService.getTeachers).toHaveBeenCalled();
      expect(mockSubjectService.getSubjects).toHaveBeenCalled();
    }));

    it('should correctly set counts with { totalItems: X } response', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(of({ totalItems: 15, data: [] }));
      mockTeacherService.getTeachers.and.returnValue(of({ totalItems: 8, data: [] }));
      mockSubjectService.getSubjects.and.returnValue(of({ totalItems: 4, data: [] }));

      fixture.detectChanges();
      tick();

      expect(component.studentCount).toBe(15);
      expect(component.teacherCount).toBe(8);
      expect(component.subjectCount).toBe(4);
    }));

    it('should correctly set counts with Entity[] response (using length)', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(of([{id:1}] as any)); // Simulate array response
      mockTeacherService.getTeachers.and.returnValue(of([{id:1},{id:2}] as any));
      mockSubjectService.getSubjects.and.returnValue(of([] as any));

      fixture.detectChanges();
      tick();

      expect(component.studentCount).toBe(1);
      expect(component.teacherCount).toBe(2);
      expect(component.subjectCount).toBe(0);
    }));

    it('should correctly set counts with { data: Entity[] } response (using data.length)', fakeAsync(() => {
        mockStudentService.getStudents.and.returnValue(of({ data: [{id:1}, {id:2}, {id:3}] } as any));
        mockTeacherService.getTeachers.and.returnValue(of({ data: [{id:1}]} as any));
        mockSubjectService.getSubjects.and.returnValue(of({ data: [] } as any));

        fixture.detectChanges();
        tick();

        expect(component.studentCount).toBe(3);
        expect(component.teacherCount).toBe(1);
        expect(component.subjectCount).toBe(0);
    }));


    it('should display admin dashboard cards', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(of({ totalItems: 10, data: [] }));
      mockTeacherService.getTeachers.and.returnValue(of({ totalItems: 5, data: [] }));
      mockSubjectService.getSubjects.and.returnValue(of({ totalItems: 3, data: [] }));

      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // After isLoading is false

      const dashboardGrid = fixture.debugElement.query(By.css('.dashboard-grid'));
      expect(dashboardGrid).toBeTruthy();
      const cards = fixture.debugElement.queryAll(By.css('.dashboard-card'));
      expect(cards.length).toBe(3);
      expect(cards[0].nativeElement.textContent).toContain('Students');
      expect(cards[0].nativeElement.textContent).toContain('Total: 10');
    }));

    it('should handle errors from services gracefully', fakeAsync(() => {
      mockStudentService.getStudents.and.returnValue(throwError(() => new Error('Student service error')));
      mockTeacherService.getTeachers.and.returnValue(of({ totalItems: 5, data: [] }));
      mockSubjectService.getSubjects.and.returnValue(of({ totalItems: 3, data: [] }));
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
      expect(component.studentCount).toBe(0); // Failed service, count should be 0
      expect(component.teacherCount).toBe(5); // Successful service
      expect(component.subjectCount).toBe(3); // Successful service
      expect(console.error).toHaveBeenCalledWith('Error loading dashboard data:', jasmine.any(Error));
    }));
  });

  describe('Non-Admin User', () => {
    beforeEach(() => {
      setupTestBed('Docente'); // Example of a non-admin role
    });

    it('isLoading should be false', () => {
      fixture.detectChanges(); // ngOnInit
      expect(component.isLoading).toBe(false);
    });

    it('should not call data fetching services', () => {
      fixture.detectChanges(); // ngOnInit
      expect(mockStudentService.getStudents).not.toHaveBeenCalled();
      expect(mockTeacherService.getTeachers).not.toHaveBeenCalled();
      expect(mockSubjectService.getSubjects).not.toHaveBeenCalled();
    });

    it('should not display admin dashboard cards', () => {
      fixture.detectChanges(); // ngOnInit
      const dashboardGrid = fixture.debugElement.query(By.css('.dashboard-grid'));
      expect(dashboardGrid).toBeFalsy();
    });
  });
});
