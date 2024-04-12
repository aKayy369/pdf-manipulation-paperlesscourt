import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPdfFunctionsComponent } from './new-pdf-functions.component';

describe('NewPdfFunctionsComponent', () => {
  let component: NewPdfFunctionsComponent;
  let fixture: ComponentFixture<NewPdfFunctionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NewPdfFunctionsComponent]
    });
    fixture = TestBed.createComponent(NewPdfFunctionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
