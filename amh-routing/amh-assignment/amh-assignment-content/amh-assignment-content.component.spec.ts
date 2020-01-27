import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AmhAssignmentContentComponent } from './amh-assignment-content.component';

describe('AmhAssignmentContentComponent', () => {
  let component: AmhAssignmentContentComponent;
  let fixture: ComponentFixture<AmhAssignmentContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AmhAssignmentContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AmhAssignmentContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
