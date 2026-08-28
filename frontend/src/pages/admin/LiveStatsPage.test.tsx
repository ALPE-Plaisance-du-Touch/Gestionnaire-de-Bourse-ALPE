import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/test-utils';
import { LiveStatsPage } from './LiveStatsPage';
import { salesApi } from '@/api';

vi.mock('@/api', () => ({
  salesApi: { getLiveStats: vi.fn() },
}));

describe('LiveStatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(salesApi.getLiveStats).mockResolvedValue({
      totalArticlesSold: 3,
      totalRevenue: 234.5,
      revenueCash: 200,
      revenueCard: 34.5,
      revenueCheck: 0,
      articlesOnSale: 7,
      sellThroughRate: 30,
      topDepositors: [],
    } as never);
  });

  it('shows amounts in French currency format', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/editions/:id/stats" element={<LiveStatsPage />} />
      </Routes>,
      { initialEntries: ['/editions/ed-1/stats'] }
    );

    // Intl separates the amount from the sign with a narrow no-break space.
    expect(await screen.findByText(/^234,50\s€$/)).toBeInTheDocument();
    expect(screen.getByText(/^200,00\s€$/)).toBeInTheDocument();
    expect(screen.getByText(/^34,50\s€$/)).toBeInTheDocument();
  });
});
