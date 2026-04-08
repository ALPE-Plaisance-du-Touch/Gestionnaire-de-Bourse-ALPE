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
    return <p className="text-bark-muted">Chargement...</p>;
  }

  if (!ticket) {
    return <p className="text-error">Ticket introuvable.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(`/editions/${editionId}/tickets`)}
            className="text-sm text-primary hover:text-primary-dark mb-2 inline-block"
          >
            &larr; Retour aux tickets
          </button>
          <h1 className="text-2xl font-bold text-bark">{ticket.subject}</h1>
          <p className="text-sm text-bark-muted mt-1">
            Par {ticket.createdByName}
            {ticket.assignedToName && <> &rarr; {ticket.assignedToName}</>}
            {' '}&middot; {formatDate(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              ticket.status === 'open'
                ? 'bg-primary/10 text-primary-dark'
                : 'bg-cream-dark text-bark-light'
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
      <div className="bg-white rounded-lg shadow-sm border border-sand p-6">
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
                      ? 'bg-primary text-white'
                      : 'bg-cream-dark text-bark'
                  }`}
                >
                  <p className={`text-xs font-medium mb-1 ${isOwnMessage ? 'text-primary' : 'text-bark-muted'}`}>
                    {msg.senderName}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary' : 'text-bark-muted'}`}>
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
          <form onSubmit={handleReply} className="border-t border-sand pt-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Votre réponse..."
              rows={3}
              maxLength={5000}
              className="w-full rounded-lg border border-sand p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-bark-muted">
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
              <p className="text-error text-sm mt-2">
                Erreur lors de l'envoi. Réessayez.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
