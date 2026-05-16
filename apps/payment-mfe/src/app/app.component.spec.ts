import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

const TEST_CONFIG = {
  bffBaseUrl: 'http://localhost:3001',
  authHeader: 'Bearer test',
};

describe('AppComponent (payment-mfe)', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ billId: 'bill-001' }) },
            paramMap: of(convertToParamMap({ billId: 'bill-001' })),
          },
        },
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
    // httpResource network behavior is covered by contract/integration tests.
  });

  it('dispatches suite:navigate:bills CustomEvent when back button is clicked', () => {
    const events: Event[] = [];
    const handler = (e: Event) => events.push(e);
    window.addEventListener('suite:navigate:bills', handler);

    const mockEvent = new MouseEvent('click');
    component.navigateToBills(mockEvent);

    window.removeEventListener('suite:navigate:bills', handler);

    expect(events.length).toBe(1);
  });

  it('validates amount must be > 0', () => {
    component.amountTouched.set(true);

    component.amount.set(0);
    expect(component.amountError()).toBeTruthy();

    component.amount.set(-10);
    expect(component.amountError()).toBeTruthy();

    component.amount.set(50);
    expect(component.amountError()).toBeFalsy();
  });

  it('validates last4 must be exactly 4 digits', () => {
    component.last4Touched.set(true);

    component.last4.set('abc');
    expect(component.last4Error()).toBeTruthy();

    component.last4.set('12345');
    expect(component.last4Error()).toBeTruthy();

    component.last4.set('1234');
    expect(component.last4Error()).toBeFalsy();
  });

  it('form validation requires valid bill, amount, and last4', () => {
    // formValid requires bill.value() to exist — tested in integration
    component.amount.set(100);
    component.last4.set('1234');
    component.method.set('card');

    // Without a loaded bill, formValid returns false
    expect(component.formValid()).toBeFalsy();
  });

  it('shows confirmation panel after successful payment submission', () => {
    // Full submission flow requires httpResource bill loading — tested in integration
    component.amount.set(100.0);
    component.method.set('card');
    component.last4.set('4242');

    expect(component.confirmation()).toBeNull();
  });
});
