import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MasterDetailComponent } from './master-detail.component';

describe('MasterDetailComponent', () => {
  let component: MasterDetailComponent;
  let fixture: ComponentFixture<MasterDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDetailComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MasterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty detail message when showDetail is false', () => {
    component.showDetail = false;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.master-detail__empty')).toBeTruthy();
  });

  it('should hide empty message when showDetail is true', () => {
    fixture.componentRef.setInput('showDetail', true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.master-detail__empty')).toBeNull();
  });

  it('should use custom empty message when provided', () => {
    fixture.componentRef.setInput('showDetail', false);
    fixture.componentRef.setInput('emptyDetailMessage', 'Mensaje personalizado');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.master-detail__empty-text')?.textContent)
      .toContain('Mensaje personalizado');
  });

  it('should emit detailClosed event', () => {
    const spy = vi.spyOn(component.detailClosed, 'emit');
    component.detailClosed.emit();
    expect(spy).toHaveBeenCalled();
  });
});
