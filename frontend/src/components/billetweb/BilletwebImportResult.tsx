import type { BilletwebImportResponse } from '@/types';

interface BilletwebImportResultProps {
  result: BilletwebImportResponse;
}

export function BilletwebImportResult({ result }: BilletwebImportResultProps) {
  const { success, message, result: importResult } = result;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className={`rounded-lg p-4 flex items-center gap-3 ${
        success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        {success ? (
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        <div>
          <p className={`font-medium ${success ? 'text-green-800' : 'text-red-800'}`}>
            {success ? 'Import reussi !' : 'Erreur lors de l\'import'}
          </p>
          <p className={`text-sm ${success ? 'text-green-700' : 'text-red-700'}`}>
            {message}
          </p>
        </div>
      </div>

      {/* Statistics */}
      {success && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3">Resultat de l'import</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Deposants associes</p>
              <p className="text-2xl font-semibold text-green-600">
                {importResult.existingDepositorsLinked}
              </p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Nouveaux comptes</p>
              <p className="text-2xl font-semibold text-blue-600">
                {importResult.newDepositorsCreated}
              </p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-gray-500">Lignes ignorees</p>
              <p className="text-2xl font-semibold text-gray-500">
                {importResult.rowsSkipped}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border flex items-center gap-3">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-gray-500">Invitations envoyees</p>
                <p className="text-xl font-semibold text-blue-600">
                  {importResult.invitationsSent}
                </p>
              </div>
            </div>
            <div className="bg-white p-3 rounded border flex items-center gap-3">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <div>
                <p className="text-gray-500">Notifications envoyees</p>
                <p className="text-xl font-semibold text-green-600">
                  {importResult.notificationsSent}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next steps */}
      {success && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Prochaines etapes</h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Les nouveaux deposants recevront un email d'invitation pour activer leur compte</li>
            <li>Les deposants existants recevront une notification de leur inscription</li>
            <li>Vous pouvez consulter la liste des deposants dans l'onglet "Deposants"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
