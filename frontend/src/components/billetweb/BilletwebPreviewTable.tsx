import type { BilletwebPreviewResponse } from '@/types';

interface BilletwebPreviewTableProps {
  preview: BilletwebPreviewResponse;
}

export function BilletwebPreviewTable({ preview }: BilletwebPreviewTableProps) {
  const { stats, errors, warnings, canImport, slotOccupancy, listTypeBreakdown } = preview;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-3">Recapitulatif</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Total lignes</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalRows}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Non payes/invalides</p>
            <p className="text-2xl font-semibold text-gray-400">{stats.rowsUnpaidInvalid}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">A traiter</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.rowsToProcess}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Erreurs</p>
            <p className={`text-2xl font-semibold ${stats.errorsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.errorsCount}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Deposants existants</p>
            <p className="text-xl font-semibold text-green-600">{stats.existingDepositors}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Nouveaux deposants</p>
            <p className="text-xl font-semibold text-blue-600">{stats.newDepositors}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Doublons dans fichier</p>
            <p className="text-xl font-semibold text-amber-600">{stats.duplicatesInFile}</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="text-gray-500">Deja inscrits</p>
            <p className="text-xl font-semibold text-gray-500">{stats.alreadyRegistered}</p>
          </div>
        </div>
      </div>

      {/* List type breakdown */}
      {(listTypeBreakdown.standard > 0 || listTypeBreakdown.list_1000 > 0 || listTypeBreakdown.list_2000 > 0) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Repartition par type</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Standard</p>
              <p className="text-xl font-semibold text-gray-900">{listTypeBreakdown.standard}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Liste 1000</p>
              <p className="text-xl font-semibold text-blue-600">{listTypeBreakdown.list_1000}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Liste 2000</p>
              <p className="text-xl font-semibold text-purple-600">{listTypeBreakdown.list_2000}</p>
            </div>
          </div>
        </div>
      )}

      {/* Slot occupancy */}
      {slotOccupancy.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Occupation creneaux</h4>
          <div className="space-y-3">
            {slotOccupancy.map((slot) => {
              const total = slot.current + slot.incoming;
              const ratio = slot.maxCapacity > 0 ? total / slot.maxCapacity : 0;
              const barColor = slot.overCapacity ? 'bg-red-500' : ratio >= 0.75 ? 'bg-orange-500' : 'bg-green-500';

              return (
                <div key={slot.slotId} className="bg-white p-3 rounded border">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{slot.slotDescription}</span>
                    <span className={slot.overCapacity ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {total} / {slot.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${barColor} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{slot.current} inscrits + {slot.incoming} nouveaux</span>
                    {slot.overCapacity && <span className="text-red-600">Depassement !</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Avertissements
          </h4>
          <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Erreurs bloquantes ({errors.length})
          </h4>
          <div className="mt-2 max-h-48 overflow-y-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-2 py-1 text-left text-red-700">Ligne</th>
                  <th className="px-2 py-1 text-left text-red-700">Email</th>
                  <th className="px-2 py-1 text-left text-red-700">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {errors.map((error, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 text-red-700">{error.rowNumber}</td>
                    <td className="px-2 py-1 text-red-700">{error.email || '-'}</td>
                    <td className="px-2 py-1 text-red-700">{error.errorMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status message */}
      {canImport ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium text-green-800">Pret a importer</p>
            <p className="text-sm text-green-700">
              {stats.existingDepositors} deposant(s) existant(s) seront associes, {stats.newDepositors} invitation(s) seront envoyees.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium text-red-800">Import impossible</p>
            <p className="text-sm text-red-700">
              Corrigez les erreurs ci-dessus avant de pouvoir importer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
