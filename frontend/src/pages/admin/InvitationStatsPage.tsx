import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { invitationsApi } from '@/api';
import { Button } from '@/components/ui';
import { CHART_PAIR } from '@/lib/chart-colors';

const LIST_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

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

export function InvitationStatsPage() {
  const [errorMessage, setErrorMessage] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['invitation-stats'],
    queryFn: () => invitationsApi.getStats(),
  });

  const handleExportExcel = async () => {
    try {
      const blob = await invitationsApi.exportExcel();
      downloadBlob(blob, 'Invitations_export.xlsx');
    } catch {
      setErrorMessage('Erreur lors du téléchargement de l\'export Excel.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/invitations"
          className="text-sm text-primary-strong hover:text-primary-strong inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux invitations
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-bark">Statistiques invitations</h1>
          <Button variant="outline" onClick={handleExportExcel}>
            Exporter Excel
          </Button>
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
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Taux d'activation"
              value={`${stats.activationRate.toFixed(1)}%`}
              tone="activation"
            />
            <StatCard
              label="Délai moyen"
              value={`${stats.avgActivationDelayDays.toFixed(1)} j`}
              tone="delay"
            />
            <StatCard
              label="Taux d'expiration"
              value={`${stats.expirationRate.toFixed(1)}%`}
              tone="expiry"
            />
            <StatCard
              label="Relances"
              value={stats.relaunchCount}
              tone="reminders"
            />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-bark">{stats.total}</p>
              <p className="text-sm text-bark-muted">Total invitations</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats.activated}</p>
              <p className="text-sm text-bark-muted">Activées</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-warning-strong">{stats.pending}</p>
              <p className="text-sm text-bark-muted">En attente</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-error-dark">{stats.expired}</p>
              <p className="text-sm text-bark-muted">Expirées</p>
            </div>
          </div>

          {/* Daily evolution chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-bark mb-4">
              Évolution par jour
            </h2>
            {stats.dailyEvolution.length === 0 ? (
              <p className="text-bark-muted text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke={CHART_PAIR[0]}
                    strokeWidth={2}
                    name="Envoyées"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activated"
                    stroke={CHART_PAIR[1]}
                    strokeWidth={2}
                    name="Activées"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* List type breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-bark mb-4">
              Ventilation par type de liste
            </h2>
            {stats.byListType.length === 0 ? (
              <p className="text-bark-muted text-center py-4">Aucune donnée</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand">
                    <th className="text-left py-2 font-medium text-bark-light">Type</th>
                    <th className="text-right py-2 font-medium text-bark-light">Nombre</th>
                    <th className="text-right py-2 font-medium text-bark-light">Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byListType.map((lt) => (
                    <tr key={lt.listType} className="border-b border-sand">
                      <td className="py-2 font-medium">
                        {LIST_TYPE_LABELS[lt.listType] || lt.listType}
                      </td>
                      <td className="py-2 text-right">{lt.count}</td>
                      <td className="py-2 text-right">{lt.percentage.toFixed(1)}%</td>
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
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'activation' | 'delay' | 'expiry' | 'reminders';
}) {
  // Named by role: `blue` and `green` had collapsed to the same style.
  const toneClasses = {
    activation: 'bg-success-soft text-success-strong',
    delay: 'bg-info-soft text-primary-strong',
    expiry: 'bg-warning-soft text-warning-strong',
    reminders: 'bg-warning-deep text-warning-strong',
  };

  return (
    <div className={`rounded-lg p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
