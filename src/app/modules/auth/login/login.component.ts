import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;
  hidePassword = true;
  sessionAlert: { icon: string; message: string; type: 'expired' | 'invalid' } | null = null;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'expired') {
      this.sessionAlert = {
        icon: 'schedule',
        message: 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.',
        type: 'expired',
      };
    } else if (reason === 'invalid') {
      this.sessionAlert = {
        icon: 'warning',
        message: 'Tu sesión no es válida. Inicia sesión nuevamente.',
        type: 'invalid',
      };
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.authService.login(this.form.value).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        const backendMsg: string = err.error?.message ?? '';
        const msg = backendMsg || 'Error del servidor. Intenta nuevamente.';
        this.snackBar.open(msg, 'Cerrar', {
          duration: 4000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  get username() { return this.form.get('username')!; }
  get password() { return this.form.get('password')!; }
}
