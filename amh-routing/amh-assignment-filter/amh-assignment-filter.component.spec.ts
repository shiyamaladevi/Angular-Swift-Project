import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmhAssignmentFilterComponent } from './amh-assignment-filter.component';

describe('AmhAssignmentFilterComponent', () => {
  let component: AmhAssignmentFilterComponent;
  let fixture: ComponentFixture<AmhAssignmentFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmhAssignmentFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmhAssignmentFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
