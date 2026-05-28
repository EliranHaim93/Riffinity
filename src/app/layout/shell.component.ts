import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="app-shell">
      <!-- Top navigation bar -->
      <header class="app-header">
        <div class="header-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <!-- Guitar body silhouette (simplified) -->
              <ellipse cx="20" cy="26" rx="13" ry="11" fill="url(#g1)" opacity="0.9"/>
              <ellipse cx="20" cy="26" rx="8" ry="7" fill="rgba(0,0,0,0.25)"/>
              <circle cx="20" cy="26" r="2.5" fill="rgba(0,0,0,0.5)"/>
              <!-- Guitar neck -->
              <rect x="18.5" y="4" width="3" height="15" rx="1.5" fill="url(#g2)"/>
              <!-- Tuning pegs -->
              <circle cx="16" cy="5" r="1.8" fill="#f0d860"/>
              <circle cx="24" cy="5" r="1.8" fill="#f0d860"/>
              <circle cx="15" cy="9" r="1.8" fill="#f0d860"/>
              <circle cx="25" cy="9" r="1.8" fill="#f0d860"/>
              <defs>
                <linearGradient id="g1" x1="7" y1="15" x2="33" y2="37" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#f0a840"/>
                  <stop offset="100%" stop-color="#c06820"/>
                </linearGradient>
                <linearGradient id="g2" x1="18" y1="4" x2="21" y2="19" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#d4b870"/>
                  <stop offset="100%" stop-color="#8a5c28"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Riffinity</span>
            <span class="brand-tagline">Guitar Fretboard Explorer</span>
          </div>
        </div>

        <nav class="header-nav">
          <span class="nav-badge beginner-badge">Beginner Friendly</span>
        </nav>
      </header>

      <!-- Page content -->
      <div class="page-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #0a0d14;
    }

    /* Header */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      display: flex;
      align-items: center;
      filter: drop-shadow(0 2px 8px rgba(240, 168, 64, 0.4));
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .brand-name {
      font-family: 'Righteous', sans-serif;
      font-size: 22px;
      font-weight: 400;
      background: linear-gradient(135deg, #ffd54f, #ffab40);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.1;
      letter-spacing: 0.5px;
    }

    .brand-tagline {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.5px;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .beginner-badge {
      background: rgba(76, 175, 80, 0.2);
      color: #81C784;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    /* Page content */
    .page-content {
      flex: 1;
      padding: 20px 24px;
      overflow-y: auto;
    }
  `],
})
export class ShellComponent {}
