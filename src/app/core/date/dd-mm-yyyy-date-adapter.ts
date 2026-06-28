import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

/**
 * Adapter de fechas que parsea y formatea en dd/MM/yyyy de forma coherente.
 *
 * Motivación: el `NativeDateAdapter` formatea la salida según el locale
 * (es-PE → dd/MM/yyyy) pero parsea el texto tecleado con `new Date(...)` de
 * JavaScript, que IGNORA el locale e interpreta M/d/yyyy. Eso provocaba un
 * desajuste parse/display: teclear "31/12/2026" (el formato mostrado) era
 * rechazado, mientras "12/31/2026" se aceptaba y se redibujaba como
 * "31/12/2026".
 *
 * Esta subclase sobrescribe únicamente `parse()` para interpretar explícitamente
 * dd/MM/yyyy (admitiendo separadores `/`, `-` o `.`), validando que la fecha
 * exista realmente (ej. 31/02/2026 → inválida). El formato de SALIDA lo sigue
 * gestionando `MAT_DATE_FORMATS` (display.dateInput de 2 dígitos) sobre el
 * adapter nativo, por lo que no se duplica lógica de formateo.
 */
@Injectable()
export class DdMmYyyyDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      const str = value.trim();
      if (!str) {
        return null;
      }
      const match = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          // Rechazar desbordes de calendario (ej. 31/02 → 3 de marzo).
          if (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          ) {
            return date;
          }
        }
        // Tiene forma dd/MM/yyyy pero la fecha no existe → fecha inválida.
        return this.invalid();
      }
    }
    // Otros formatos (ej. selección por calendario) → comportamiento nativo.
    return super.parse(value);
  }
}
