import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start expanded (collapsed = false)', async () => {
    const collapsed = await firstValueFrom(service.collapsed$);
    expect(collapsed).toBe(false);
  });

  it('should toggle from expanded to collapsed', async () => {
    service.toggle();
    const collapsed = await firstValueFrom(service.collapsed$);
    expect(collapsed).toBe(true);
  });

  it('should toggle back to expanded', async () => {
    service.toggle();
    service.toggle();
    const collapsed = await firstValueFrom(service.collapsed$);
    expect(collapsed).toBe(false);
  });

  it('should collapse directly', async () => {
    service.collapse();
    const collapsed = await firstValueFrom(service.collapsed$);
    expect(collapsed).toBe(true);
  });

  it('should expand after collapse', async () => {
    service.collapse();
    service.expand();
    const collapsed = await firstValueFrom(service.collapsed$);
    expect(collapsed).toBe(false);
  });
});
