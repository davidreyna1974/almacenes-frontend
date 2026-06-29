import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgZone } from '@angular/core';
import { vi } from 'vitest';
import { GlobalErrorHandler } from './global-error-handler';

import * as Sentry from '@sentry/angular';

vi.mock('@sentry/angular', () => ({
  captureException: vi.fn(),
}));

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let snackBarOpen: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    snackBarOpen = vi.fn();
    await TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: NgZone, useValue: { run: (fn: () => void) => fn() } },
      ],
    }).compileComponents();
    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('should create', () => {
    expect(handler).toBeTruthy();
  });

  it('should call snackBar.open on error', () => {
    handler.handleError(new Error('test error'));
    expect(snackBarOpen).toHaveBeenCalledWith(
      'Error inesperado. Por favor recarga la página.',
      'Cerrar',
      expect.objectContaining({ panelClass: ['snackbar-error'] })
    );
  });

  it('should call Sentry.captureException on error', () => {
    const err = new Error('sentry test');
    handler.handleError(err);
    expect(Sentry.captureException).toHaveBeenCalledWith(err);
  });

  it('should not throw if snackBar itself fails', () => {
    snackBarOpen.mockImplementationOnce(() => { throw new Error('snackbar error'); });
    expect(() => handler.handleError(new Error('test'))).not.toThrow();
  });
});
