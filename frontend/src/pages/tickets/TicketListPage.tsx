import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '@/api/tickets';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/Button';

export function TicketListPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | ''>('');
  const [page, setPage] = useState(1);
  const isStaff = user && user.role !== 'depositor';

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', editionId, statusFilter, page],
    queryFn: () =>
      ticketsApi.listTickets(editionId!, {
        status: statusFilter || undefined,
        page,
        perPage: 20,
      }),
    enabled: !!editionId,
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <Button onClick={() => navigate(`/editions/${editionId}/tickets/new`)}>
          Nouveau ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === '' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => { setStatusFilter(''); setPage(1); }}
        >
          Tous
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => { setStatusFilter('open'); setPage(1); }}
        >
          Ouverts
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === 'closed' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => { setStatusFilter('closed'); setPage(1); }}
        >
          Fermés
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : !data || data.tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun ticket pour le moment.</p>
          <p className="text-gray-400 mt-2">Créez un ticket pour contacter le staff.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                onClick={() => navigate(`/editions/${editionId}/tickets/${ticket.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {ticket.subject}
                      </h3>
                      {ticket.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {isStaff ? (
                        <>De : {ticket.createdByName}{ticket.assignedToName && <> &rarr; {ticket.assignedToName}</>}</>
                      ) : (
                        <>Créé le {formatDate(ticket.createdAt)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        ticket.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
                    </span>
                    {ticket.lastMessageAt && (
                      <span className="text-xs text-gray-400">
                        {formatDate(ticket.lastMessageAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.total > 20 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {page} / {Math.ceil(data.total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(data.total / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
