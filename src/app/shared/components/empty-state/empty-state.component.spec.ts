import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state by default', () => {
    expect(component.variant).toBe('empty');
    expect(component.icon).toBe('inventory_2');
    expect(component.title).toBe('Sin datos');
  });

  it('should show no-results state when variant is no-results', () => {
    component.variant = 'no-results';
    expect(component.icon).toBe('search_off');
    expect(component.title).toBe('Sin resultados');
  });

  it('should render title in the template', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__title')?.textContent).toContain('Sin datos');
  });

  it('should render no-results description when variant is no-results', () => {
    fixture.componentRef.setInput('variant', 'no-results');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state__description')?.textContent)
      .toContain('filtros aplicados');
  });
});
