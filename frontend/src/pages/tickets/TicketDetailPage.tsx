import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/api/tickets';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/Button';

export function TicketDetailPage() {
  const { id: editionId, ticketId } = useParams<{ id: string; ticketId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStaff = user && user.role !== 'depositor';

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', editionId, ticketId],
    queryFn: () => ticketsApi.getTicket(editionId!, ticketId!),
    enabled: !!editionId && !!ticketId,
    refetchInterval: 15000,
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      ticketsApi.replyToTicket(editionId!, ticketId!, { content: replyContent }),
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['ticket', editionId, ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-unread'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketsApi.closeTicket(editionId!, ticketId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', editionId, ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => ticketsApi.reopenTicket(editionId!, ticketId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', editionId, ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      replyMutation.mutate();
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">Chargement...</p>;
  }

  if (!ticket) {
    return <p className="text-red-500">Ticket introuvable.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(`/editions/${editionId}/tickets`)}
            className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            &larr; Retour aux tickets
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Par {ticket.createdByName}
            {ticket.assignedToName && <> &rarr; {ticket.assignedToName}</>}
            {' '}&middot; {formatDate(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              ticket.status === 'open'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {ticket.status === 'open' ? 'Ouvert' : 'Fermé'}
          </span>
          {isStaff && ticket.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => closeMutation.mutate()}
              isLoading={closeMutation.isPending}
            >
              Fermer
            </Button>
          )}
          {isStaff && ticket.status === 'closed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => reopenMutation.mutate()}
              isLoading={reopenMutation.isPending}
            >
              Rouvrir
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6">
        {ticket.messages.map((msg) => {
          const isOwnMessage = msg.senderId === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  isOwnMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.senderName}
                </p>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'}`}>
                  {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply form */}
      {ticket.status === 'open' && (
        <form onSubmit={handleReply} className="border-t border-gray-200 pt-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Votre réponse..."
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-400">
              {replyContent.length} / 5000
            </span>
            <Button
              type="submit"
              disabled={!replyContent.trim()}
              isLoading={replyMutation.isPending}
            >
              Envoyer
            </Button>
          </div>
          {replyMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              Erreur lors de l'envoi. Réessayez.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
