import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmhAssignmentSearchComponent } from './amh-assignment-search.component';

describe('AmhAssignmentSearchComponent', () => {
  let component: AmhAssignmentSearchComponent;
  let fixture: ComponentFixture<AmhAssignmentSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmhAssignmentSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmhAssignmentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
