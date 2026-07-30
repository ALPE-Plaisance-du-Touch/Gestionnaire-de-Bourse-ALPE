import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { salesApi } from '@/api';
import { TrainingBanner } from '@/components/ui/TrainingBanner';

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
          className="text-sm text-primary-strong hover:text-primary-strong mb-1 inline-block"
        >
          &larr; Retour à l'édition
        </Link>
        <h1 className="text-2xl font-bold text-bark">Stats en direct</h1>
        <p className="text-sm text-bark-muted mt-1">
          Actualisation automatique toutes les 10 secondes
        </p>
      </div>

      <TrainingBanner editionId={editionId!} />

      {isLoading ? (
        <div className="text-center py-12 text-bark-muted">Chargement des statistiques...</div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Main stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Articles vendus"
              value={stats.totalArticlesSold}
              tone="sold"
            />
            <StatCard
              label="Chiffre d'affaires"
              value={`${Number(stats.totalRevenue).toFixed(2)} EUR`}
              tone="revenue"
            />
            <StatCard
              label="Articles en vente"
              value={stats.articlesOnSale}
              tone="onSale"
            />
            <StatCard
              label="Taux de vente"
              value={`${stats.sellThroughRate}%`}
              tone="rate"
            />
          </div>

          {/* Revenue by payment method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-bark mb-4">
              Chiffre d'affaires par moyen de paiement
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-info-soft rounded-lg">
                <p className="text-sm text-bark-light">Espèces</p>
                <p className="text-2xl font-bold text-primary-strong">
                  {Number(stats.revenueCash).toFixed(2)} EUR
                </p>
              </div>
              <div className="text-center p-4 bg-info-soft rounded-lg">
                <p className="text-sm text-bark-light">Carte bancaire</p>
                <p className="text-2xl font-bold text-primary-strong">
                  {Number(stats.revenueCard).toFixed(2)} EUR
                </p>
              </div>
              <div className="text-center p-4 bg-warning-soft rounded-lg">
                <p className="text-sm text-bark-light">Chèque</p>
                <p className="text-2xl font-bold text-warning-strong">
                  {Number(stats.revenueCheck).toFixed(2)} EUR
                </p>
              </div>
            </div>
          </div>

          {/* Top depositors */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-bark mb-4">
              Top 5 déposants
            </h2>
            {stats.topDepositors.length === 0 ? (
              <p className="text-bark-muted text-center py-4">Aucune vente enregistrée</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand">
                    <th className="text-left py-2 font-medium text-bark-light">#</th>
                    <th className="text-left py-2 font-medium text-bark-light">Déposant</th>
                    <th className="text-right py-2 font-medium text-bark-light">Articles</th>
                    <th className="text-right py-2 font-medium text-bark-light">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topDepositors.map((dep, index) => (
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'sold' | 'revenue' | 'onSale' | 'rate';
}) {
  // Named by role: `blue` and `green` had become the same style, so the names no
  // longer described anything.
  const toneClasses = {
    sold: 'bg-info-soft text-primary-strong',
    revenue: 'bg-success-soft text-success-strong',
    onSale: 'bg-cream-dark text-bark-light',
    rate: 'bg-warning-deep text-warning-strong',
  };

  return (
    <div className={`rounded-lg p-4 ${toneClasses[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
