import {ComponentFixture, TestBed} from '@angular/core/testing';

import {KnowledgeGraphComponent} from './knowledge-graph.component';

describe('KnowledgeGraph', () => {
  let component: KnowledgeGraphComponent;
  let fixture: ComponentFixture<KnowledgeGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KnowledgeGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KnowledgeGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
