import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then(module => module.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/fretboard/fretboard.component').then(
            module => module.FretboardComponent,
          ),
      },
    ],
  },
];
