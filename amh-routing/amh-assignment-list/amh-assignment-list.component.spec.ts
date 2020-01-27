import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmhAssignmentListComponent } from './amh-assignment-list.component';

describe('AmhAssignmentListComponent', () => {
  let component: AmhAssignmentListComponent;
  let fixture: ComponentFixture<AmhAssignmentListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmhAssignmentListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmhAssignmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
