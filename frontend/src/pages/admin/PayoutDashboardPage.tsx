import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { payoutsApi } from '@/api';
import { CHART_COLORS, CHART_PRIMARY } from '@/lib/chart-colors';
import { Button } from '@/components/ui';

const CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Vêtements',
  toys: 'Jouets',
  books: 'Livres',
  childcare: 'Puériculture',
  other: 'Autres',
};

const CATEGORY_COLORS = CHART_COLORS;

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function PayoutDashboardPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const [errorMessage, setErrorMessage] = useState('');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['payout-dashboard', editionId],
    queryFn: () => payoutsApi.getDashboard(editionId!),
    enabled: !!editionId,
    refetchInterval: 10000,
  });

  const handleExportExcel = async () => {
    try {
      const blob = await payoutsApi.exportExcel(editionId!);
      downloadBlob(blob, 'Reversements_export.xlsx');
    } catch {
      setErrorMessage('Erreur lors du téléchargement de l\'export Excel.');
    }
  };

  const handleDownloadClosureReport = async () => {
    try {
      const blob = await payoutsApi.downloadClosureReport(editionId!);
      downloadBlob(blob, 'Rapport_cloture.pdf');
    } catch {
      setErrorMessage('Erreur lors du téléchargement du rapport de clôture.');
    }
  };

  const categoryData = (dashboard?.categoryStats ?? []).map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    tauxVente: c.sellThroughRate,
    revenue: c.totalRevenue,
    articles: c.totalArticles,
    vendus: c.soldArticles,
  }));

  const priceData = dashboard?.priceDistribution ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}/payouts`}
          className="text-sm text-primary-strong hover:text-primary-strong inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux reversements
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-bark">Statistiques détaillées</h1>
            <p className="text-sm text-bark-muted mt-1">
              Actualisation automatique toutes les 10 secondes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              Exporter Excel
            </Button>
            <Button variant="outline" onClick={handleDownloadClosureReport}>
              Rapport de clôture
            </Button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-error-soft border border-error/40 text-error-dark px-4 py-3 rounded-lg flex justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-error-dark font-bold">x</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-bark-muted">Chargement des statistiques...</div>
      ) : dashboard ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total ventes"
              value={`${Number(dashboard.totalSales).toFixed(2)} EUR`}
              tone="sales"
            />
            <StatCard
              label="Commission ALPE"
              value={`${Number(dashboard.totalCommission).toFixed(2)} EUR`}
              tone="commission"
            />
            <StatCard
              label="Total reversements"
              value={`${Number(dashboard.totalNet).toFixed(2)} EUR`}
              tone="payout"
            />
            <StatCard
              label="Taux de vente"
              value={`${dashboard.sellThroughRate}%`}
              tone="rate"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-bark mb-4">
                Taux de vente par categorie
              </h2>
              {categoryData.length === 0 ? (
                <p className="text-bark-muted text-center py-8">Aucune donnee</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis unit="%" />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taux de vente']}
                    />
                    <Bar dataKey="tauxVente" radius={[4, 4, 0, 0]}>
                      {categoryData.map((_entry, index) => (
                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Price distribution chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-bark mb-4">
                Distribution des prix
              </h2>
              {priceData.length === 0 ? (
                <p className="text-bark-muted text-center py-8">Aucune donnee</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, 'Articles']}
                    />
                    <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 10 depositors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-bark mb-4">
              Top 10 déposants
            </h2>
            {dashboard.topDepositors.length === 0 ? (
              <p className="text-bark-muted text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand">
                    <th className="text-left py-2 font-medium text-bark-light">#</th>
                    <th className="text-left py-2 font-medium text-bark-light">Déposant</th>
                    <th className="text-right py-2 font-medium text-bark-light">Articles vendus</th>
                    <th className="text-right py-2 font-medium text-bark-light">Total ventes</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topDepositors.map((dep, index) => (
                    <tr key={dep.depositorName} className="border-b border-sand">
                      <td className="py-2 text-bark-muted">{index + 1}</td>
                      <td className="py-2 font-medium">{dep.depositorName}</td>
                      <td className="py-2 text-right">{dep.articlesSold}</td>
                      <td className="py-2 text-right font-semibold">
                        {Number(dep.totalRevenue).toFixed(2)} EUR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Named by role rather than by colour: the old names had stopped describing what was
// rendered (`blue` and `green` were the same style once the palette changed).
function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'sales' | 'commission' | 'payout' | 'rate';
}) {
  const toneClasses = {
    sales: 'bg-info-soft text-primary-strong',
    commission: 'bg-success-soft text-success-strong',
    payout: 'bg-warning-soft text-warning-strong',
    rate: 'bg-warning-deep text-warning-strong',
  };

  return (
    <div className={`rounded-lg p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
