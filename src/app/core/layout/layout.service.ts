import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private collapsedSubject = new BehaviorSubject<boolean>(false);
  collapsed$ = this.collapsedSubject.asObservable();

  toggle(): void {
    this.collapsedSubject.next(!this.collapsedSubject.value);
  }

  get isCollapsed(): boolean {
    return this.collapsedSubject.value;
  }

  collapse(): void {
    this.collapsedSubject.next(true);
  }

  expand(): void {
    this.collapsedSubject.next(false);
  }
}
