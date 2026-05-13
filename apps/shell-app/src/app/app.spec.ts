import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { NxWelcome } from './nx-welcome';
import { APP_CONFIG } from './app-config.token';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, NxWelcome],
      providers: [
        provideRouter([]),
        {
          provide: APP_CONFIG,
          useValue: {
            bffBaseUrl: 'http://localhost:3001',
            authHeader: 'Bearer demo-token'
          }
        }
      ]
    }).compileComponents();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.shell-title');
    expect(title?.textContent).toBe('Billing Portal');
  });
});
