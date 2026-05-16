import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { STANDARDS_CONFIG } from './standards.config';

@Component({
  selector: 'app-architecture-standards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './architecture-standards.component.html',
  styleUrl: './architecture-standards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureStandardsComponent {
  protected readonly standards = STANDARDS_CONFIG;
  protected readonly standardsDocBaseUrl =
    'https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md';

  protected standardsDocSectionUrl(anchor: string): string {
    return `${this.standardsDocBaseUrl}#${anchor}`;
  }
}
