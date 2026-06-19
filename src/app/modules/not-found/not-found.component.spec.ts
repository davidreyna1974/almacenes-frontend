import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [{ provide: Router, useValue: { navigate: vi.fn() } }],
    }).compileComponents();
    fixture = TestBed.createComponent(NotFoundComponent);
    router  = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display 404', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('404');
  });

  it('goHome() navigates to /', () => {
    fixture.componentInstance.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
