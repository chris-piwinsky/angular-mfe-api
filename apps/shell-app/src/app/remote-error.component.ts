import { Component, input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-remote-error',
  template: `
    <div class="remote-error">
      <p>⚠ {{ message() }}</p>
    </div>
  `,
  styles: [`
    .remote-error {
      padding: 16px;
      background: #fde8e8;
      border: 1px solid #f5c6c6;
      border-radius: 4px;
      color: #c62828;
      margin: 16px;
    }
  `],
})
export class RemoteErrorComponent {
  message = input('This feature is temporarily unavailable. Please try again later.');
}
