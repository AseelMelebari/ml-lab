import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AppRoutes } from '@/routes';
import type { ReactNode } from 'react';
import type { Lang } from '@/i18n/types';

export function renderApp(path = '/', lang?: Lang) {
  return render(
    <ThemeProvider>
      <I18nProvider initial={lang}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </I18nProvider>
    </ThemeProvider>,
  );
}

export function renderWithProviders(ui: ReactNode, lang?: Lang) {
  return render(
    <ThemeProvider>
      <I18nProvider initial={lang}>
        <MemoryRouter>{ui}</MemoryRouter>
      </I18nProvider>
    </ThemeProvider>,
  );
}
