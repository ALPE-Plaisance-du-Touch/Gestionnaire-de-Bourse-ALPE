import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/api/tickets';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui/Button';
import type { User } from '@/types';

export function CreateTicketPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStaff = user && user.role !== 'depositor';

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [error, setError] = useState('');

  // Staff can assign to a specific depositor — lazy load depositors for the edition
  const { data: depositors } = useQuery({
    queryKey: ['edition-depositors', editionId],
    queryFn: async () => {
      const { apiClient } = await import('@/api/client');
      const response = await apiClient.get(`/v1/editions/${editionId}/depositors`);
      return (response.data as { depositors: Array<{ user: User }> }).depositors;
    },
    enabled: !!editionId && !!isStaff,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      ticketsApi.createTicket(editionId!, {
        subject,
        content,
        assigned_to_id: isStaff && assignedToId ? assignedToId : undefined,
      }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate(`/editions/${editionId}/tickets/${ticket.id}`);
    },
    onError: () => {
      setError('Erreur lors de la création du ticket. Réessayez.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !content.trim()) {
      setError('Le sujet et le message sont requis.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate(`/editions/${editionId}/tickets`)}
        className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
      >
        &larr; Retour aux tickets
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nouveau ticket</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isStaff && depositors && depositors.length > 0 && (
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
              Destinataire (déposant)
            </label>
            <select
              id="assignedTo"
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Aucun (ticket interne) --</option>
              {depositors.map((d) => (
                <option key={d.user.id} value={d.user.id}>
                  {d.user.firstName} {d.user.lastName} ({d.user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Sujet
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            placeholder="Sujet du ticket..."
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Décrivez votre demande..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{content.length} / 5000</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/editions/${editionId}/tickets`)}
          >
            Annuler
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Créer le ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
