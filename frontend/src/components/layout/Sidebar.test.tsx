import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { Sidebar } from './Sidebar';
import { useUser } from '@/contexts';
import { editionsApi } from '@/api/editions';
import { ticketsApi } from '@/api/tickets';

vi.mock('@/contexts', async () => {
  const actual = await vi.importActual<typeof import('@/contexts')>('@/contexts');
  return { ...actual, useUser: vi.fn() };
});

vi.mock('@/api/editions', () => ({
  editionsApi: { getActiveEdition: vi.fn() },
}));

vi.mock('@/api/tickets', () => ({
  ticketsApi: { getUnreadCount: vi.fn() },
}));

function renderSidebar(path: string) {
  renderWithProviders(
    <Sidebar
      isCollapsed={false}
      onToggle={() => {}}
      isMobileOpen={false}
      onMobileClose={() => {}}
    />,
    { initialEntries: [path] }
  );
  // The drawer duplicates every link for mobile; scope to the desktop nav.
  return within(screen.getAllByRole('navigation')[0]);
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUser).mockReturnValue({ role: 'administrator' } as never);
    vi.mocked(editionsApi.getActiveEdition).mockResolvedValue({
      edition: {
        id: 'ed-1',
        labelsEnabled: true,
        salesEnabled: true,
        payoutsEnabled: true,
        ticketsEnabled: true,
      },
    } as never);
    vi.mocked(ticketsApi.getUnreadCount).mockResolvedValue({ unreadCount: 0 } as never);
  });

  it('marks only the most specific entry as the current page', async () => {
    const nav = renderSidebar('/editions/ed-1/sales');

    expect(await nav.findByRole('link', { name: 'Caisse' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(nav.getByRole('link', { name: 'Configuration' })).not.toHaveAttribute(
      'aria-current'
    );
    expect(nav.getByRole('link', { name: 'Éditions' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('distinguishes an entry from the deeper entry nested under it', async () => {
    const nav = renderSidebar('/editions/ed-1/sales/manage');

    expect(
      await nav.findByRole('link', { name: 'Gestion des ventes' })
    ).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Caisse' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('keeps the parent entry current on one of its sub-routes', async () => {
    const nav = renderSidebar('/editions/ed-1/payouts/dashboard');

    expect(await nav.findByRole('link', { name: 'Reversements' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('leaves the dashboard uncurrent on the other admin routes', async () => {
    const nav = renderSidebar('/admin/users');

    expect(await nav.findByRole('link', { name: 'Utilisateurs' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(nav.getByRole('link', { name: 'Tableau de bord' })).not.toHaveAttribute(
      'aria-current'
    );
  });
});
