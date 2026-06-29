import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AccessDeniedComponent } from './access-denied.component';

describe('AccessDeniedComponent', () => {
  let fixture: ComponentFixture<AccessDeniedComponent>;
  let location: Location;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDeniedComponent],
      providers: [
        { provide: Location, useValue: { back: vi.fn() } },
        { provide: Router,   useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();
    fixture  = TestBed.createComponent(AccessDeniedComponent);
    location = TestBed.inject(Location);
    router   = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display 403', () => {
    expect(fixture.nativeElement.textContent).toContain('403');
  });

  it('goBack() calls location.back()', () => {
    fixture.componentInstance.goBack();
    expect(location.back).toHaveBeenCalled();
  });

  it('goHome() navigates to /', () => {
    fixture.componentInstance.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
