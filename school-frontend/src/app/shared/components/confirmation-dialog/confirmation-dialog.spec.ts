import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // To disable animations

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let mockDialogRef: MatDialogRef<ConfirmationDialogComponent>;
  const mockDialogData: ConfirmationDialogData = {
    title: 'Test Title',
    message: 'Are you sure about this test action?',
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Abort'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule, // Important for Material components
        MatDialogModule,
        MatButtonModule,
        ConfirmationDialogComponent // Since it's standalone
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message from MAT_DIALOG_DATA', () => {
    const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]')).nativeElement;
    const messageElement = fixture.debugElement.query(By.css('mat-dialog-content p')).nativeElement;
    expect(titleElement.textContent).toBe(mockDialogData.title);
    expect(messageElement.textContent).toBe(mockDialogData.message);
  });

  it('should display confirm and cancel button texts from MAT_DIALOG_DATA', () => {
    const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
    // Assuming order: Cancel, Confirm based on HTML structure
    const cancelButtonText = buttons[0].nativeElement.textContent.trim();
    const confirmButtonText = buttons[1].nativeElement.textContent.trim();

    expect(cancelButtonText).toBe(mockDialogData.cancelButtonText!);
    expect(confirmButtonText).toBe(mockDialogData.confirmButtonText!);
  });

  it('should use default title and button texts if not provided in MAT_DIALOG_DATA', () => {
    // Re-configure with minimal data
    const minimalData: ConfirmationDialogData = { message: 'Minimal message.' };
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: minimalData });

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers constructor and ngOnInit with new data

    const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]')).nativeElement;
    const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
    const cancelButtonText = buttons[0].nativeElement.textContent.trim();
    const confirmButtonText = buttons[1].nativeElement.textContent.trim();

    expect(titleElement.textContent).toBe('Confirm Action'); // Default title
    expect(messageElement.textContent).toBe(minimalData.message); // message should still be minimalData's message
    expect(cancelButtonText).toBe('Cancel'); // Default cancel text
    expect(confirmButtonText).toBe('Confirm'); // Default confirm text
  });

  // Need to get the message element again inside the previous test case
  it('should use default title and button texts if not provided (corrected)', () => {
    const minimalData: ConfirmationDialogData = { message: 'Minimal message.' };
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: minimalData });

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]')).nativeElement;
    const messageElement = fixture.debugElement.query(By.css('mat-dialog-content p')).nativeElement; // Get it here
    const buttons = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'));
    const cancelButtonText = buttons[0].nativeElement.textContent.trim();
    const confirmButtonText = buttons[1].nativeElement.textContent.trim();

    expect(titleElement.textContent).toBe('Confirm Action');
    expect(messageElement.textContent).toBe(minimalData.message);
    expect(cancelButtonText).toBe('Cancel');
    expect(confirmButtonText).toBe('Confirm');
  });


  it('onConfirm() should call dialogRef.close(true)', () => {
    component.onConfirm();
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
  });

  it('onCancel() should call dialogRef.close(false)', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should call onConfirm() when the confirm button is clicked', () => {
    spyOn(component, 'onConfirm');
    const confirmButton = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'))[1].nativeElement;
    confirmButton.click();
    expect(component.onConfirm).toHaveBeenCalled();
  });

  it('should call onCancel() when the cancel button is clicked', () => {
    spyOn(component, 'onCancel');
    const cancelButton = fixture.debugElement.queryAll(By.css('mat-dialog-actions button'))[0].nativeElement;
    cancelButton.click();
    expect(component.onCancel).toHaveBeenCalled();
  });
});
