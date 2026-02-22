import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, type AuditLogFilters } from '@/api/audit';
import { Button } from '@/components/ui/Button';

const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  login_failed: 'Connexion échouée',
  logout: 'Déconnexion',
  password_reset: 'Réinitialisation MDP',
  account_activated: 'Activation compte',
  profile_updated: 'Modification profil',
  data_exported: 'Export données',
  account_deleted: 'Suppression compte',
  edition_created: 'Création édition',
  edition_updated: 'Modification édition',
  edition_closed: 'Clôture édition',
  edition_archived: 'Archivage édition',
  invitation_sent: 'Invitation envoyée',
  invitation_bulk: 'Import invitations',
  sale_registered: 'Vente enregistrée',
  sale_cancelled: 'Vente annulée',
  sales_synced: 'Sync ventes offline',
  payout_calculated: 'Calcul reversements',
  payout_paid: 'Reversement payé',
};

const RESULT_STYLES: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failure: 'bg-red-100 text-red-800',
  error: 'bg-red-100 text-red-800',
};

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 50 });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditApi.list(filters),
  });

  const handleFilterChange = (key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Journal d'audit</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Toutes</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email utilisateur</label>
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depuis</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jusqu'à</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile card layout */}
        {isLoading ? (
          <div className="md:hidden p-8 text-center text-gray-500">Chargement...</div>
        ) : !data?.items.length ? (
          <div className="md:hidden p-8 text-center text-gray-500">Aucune entrée de journal trouvée.</div>
        ) : (
          <div className="md:hidden divide-y divide-gray-200">
            {data.items.map((log) => (
              <div key={log.id} className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-gray-900">
                    {ACTION_LABELS[log.action] || log.action}
                  </div>
                  <span className={`inline-flex shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${RESULT_STYLES[log.result] || 'bg-gray-100 text-gray-800'}`}>
                    {log.result}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                <div className="text-sm text-gray-600">
                  {log.userEmail || '-'}{log.role ? ` (${log.role})` : ''}
                </div>
                {log.ipAddress && (
                  <div className="text-xs text-gray-400 font-mono">{log.ipAddress}</div>
                )}
                {log.detail && (
                  <div className="text-sm text-gray-600 break-words">{log.detail}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détail</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune entrée de journal trouvée.
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {ACTION_LABELS[log.action] || log.action}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.userEmail || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {log.role || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.detail || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${RESULT_STYLES[log.result] || 'bg-gray-100 text-gray-800'}`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Page {data.page} sur {data.pages} ({data.total} entrées)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.pages}
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
