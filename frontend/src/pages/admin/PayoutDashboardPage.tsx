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
import { Button } from '@/components/ui';

const CATEGORY_LABELS: Record<string, string> = {
  clothing: 'Vetements',
  toys: 'Jouets',
  books: 'Livres',
  childcare: 'Puericulture',
  other: 'Autres',
};

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];

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
      setErrorMessage('Erreur lors du telechargement de l\'export Excel.');
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
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux reversements
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statistiques détaillées</h1>
            <p className="text-sm text-gray-500 mt-1">
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
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-700 font-bold">x</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement des statistiques...</div>
      ) : dashboard ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total ventes"
              value={`${Number(dashboard.totalSales).toFixed(2)} EUR`}
              color="blue"
            />
            <StatCard
              label="Commission ALPE"
              value={`${Number(dashboard.totalCommission).toFixed(2)} EUR`}
              color="green"
            />
            <StatCard
              label="Total reversements"
              value={`${Number(dashboard.totalNet).toFixed(2)} EUR`}
              color="amber"
            />
            <StatCard
              label="Taux de vente"
              value={`${dashboard.sellThroughRate}%`}
              color="purple"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Taux de vente par categorie
              </h2>
              {categoryData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune donnee</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Distribution des prix
              </h2>
              {priceData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune donnee</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, 'Articles']}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 10 depositors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top 10 déposants
            </h2>
            {dashboard.topDepositors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">#</th>
                    <th className="text-left py-2 font-medium text-gray-600">Déposant</th>
                    <th className="text-right py-2 font-medium text-gray-600">Articles vendus</th>
                    <th className="text-right py-2 font-medium text-gray-600">Total ventes</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.topDepositors.map((dep, index) => (
                    <tr key={dep.depositorName} className="border-b border-gray-100">
                      <td className="py-2 text-gray-500">{index + 1}</td>
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
