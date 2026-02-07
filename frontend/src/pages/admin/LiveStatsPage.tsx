import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api';

export function LiveStatsPage() {
  const { id: editionId } = useParams<{ id: string }>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['sales-stats', editionId],
    queryFn: () => salesApi.getLiveStats(editionId!),
    enabled: !!editionId,
    refetchInterval: 10000,
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}`}
          className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
        >
          &larr; Retour a l'edition
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Stats en direct</h1>
        <p className="text-sm text-gray-500 mt-1">
          Actualisation automatique toutes les 10 secondes
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement des statistiques...</div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Main stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Articles vendus"
              value={stats.totalArticlesSold}
              color="blue"
            />
            <StatCard
              label="Chiffre d'affaires"
              value={`${Number(stats.totalRevenue).toFixed(2)} EUR`}
              color="green"
            />
            <StatCard
              label="Articles en vente"
              value={stats.articlesOnSale}
              color="gray"
            />
            <StatCard
              label="Taux de vente"
              value={`${stats.sellThroughRate}%`}
              color="purple"
            />
          </div>

          {/* Revenue by payment method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Chiffre d'affaires par moyen de paiement
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Especes</p>
                <p className="text-2xl font-bold text-green-700">
                  {Number(stats.revenueCash).toFixed(2)} EUR
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Carte bancaire</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Number(stats.revenueCard).toFixed(2)} EUR
                </p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Cheque</p>
                <p className="text-2xl font-bold text-amber-700">
                  {Number(stats.revenueCheck).toFixed(2)} EUR
                </p>
              </div>
            </div>
          </div>

          {/* Top depositors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Top 5 deposants
            </h2>
            {stats.topDepositors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune vente enregistree</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">#</th>
                    <th className="text-left py-2 font-medium text-gray-600">Deposant</th>
                    <th className="text-right py-2 font-medium text-gray-600">Articles</th>
                    <th className="text-right py-2 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topDepositors.map((dep, index) => (
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
  color: 'blue' | 'green' | 'gray' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    gray: 'bg-gray-50 text-gray-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
