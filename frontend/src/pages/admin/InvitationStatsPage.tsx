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
      setErrorMessage('Erreur lors du telechargement de l\'export Excel.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/invitations"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux invitations
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Statistiques invitations</h1>
          <Button variant="outline" onClick={handleExportExcel}>
            Exporter Excel
          </Button>
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
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Taux d'activation"
              value={`${stats.activationRate.toFixed(1)}%`}
              color="green"
            />
            <StatCard
              label="Delai moyen"
              value={`${stats.avgActivationDelayDays.toFixed(1)} j`}
              color="blue"
            />
            <StatCard
              label="Taux d'expiration"
              value={`${stats.expirationRate.toFixed(1)}%`}
              color="amber"
            />
            <StatCard
              label="Relances"
              value={stats.relaunchCount}
              color="purple"
            />
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total invitations</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.activated}</p>
              <p className="text-sm text-gray-500">Activees</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-gray-500">Expirees</p>
            </div>
          </div>

          {/* Daily evolution chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Evolution par jour
            </h2>
            {stats.dailyEvolution.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune donnee</p>
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
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Envoyees"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activated"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Activees"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* List type breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ventilation par type de liste
            </h2>
            {stats.byListType.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune donnee</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">Type</th>
                    <th className="text-right py-2 font-medium text-gray-600">Nombre</th>
                    <th className="text-right py-2 font-medium text-gray-600">Pourcentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byListType.map((lt) => (
                    <tr key={lt.listType} className="border-b border-gray-100">
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
