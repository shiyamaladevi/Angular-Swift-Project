import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmhAssignmentComponent } from './amh-assignment.component';

describe('AmhAssignmentComponent', () => {
  let component: AmhAssignmentComponent;
  let fixture: ComponentFixture<AmhAssignmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmhAssignmentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmhAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
