import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import type { UserProfileUpdate } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  depositor: 'Déposant',
  volunteer: 'Bénévole',
  manager: 'Gestionnaire',
  administrator: 'Administrateur',
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.getProfile,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<UserProfileUpdate>({});

  const updateMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
  });

  const exportMutation = useMutation({
    mutationFn: usersApi.exportData,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-personnelles.json';
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: async () => {
      await logout();
      navigate('/login');
    },
  });

  const startEditing = () => {
    if (!user) return;
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      address: user.address || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName) return;
    updateMutation.mutate(formData);
  };

  const handleExportAndDelete = async () => {
    try {
      const blob = await usersApi.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees-personnelles.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Continue with deletion even if export fails
    }
    deleteMutation.mutate();
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-gray-500">Utilisateur introuvable.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

      {/* Profile info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Informations personnelles</h2>
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={startEditing}>
              Modifier
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Nom"
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Téléphone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <div>
              <label htmlFor="profile-address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <textarea
                id="profile-address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
            </div>
            {updateMutation.isError && (
              <p className="text-sm text-red-600">Erreur lors de la mise à jour du profil.</p>
            )}
          </div>
        ) : (
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Prénom</dt>
              <dd className="text-sm text-gray-900">{user.firstName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Nom</dt>
              <dd className="text-sm text-gray-900">{user.lastName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Téléphone</dt>
              <dd className="text-sm text-gray-900">{user.phone || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Adresse</dt>
              <dd className="text-sm text-gray-900">{user.address || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Rôle</dt>
              <dd className="text-sm text-gray-900">{ROLE_LABELS[user.role] || user.role}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Data export section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Mes données personnelles</h2>
        <p className="text-sm text-gray-600 mb-4">
          Conformément au RGPD, vous pouvez exporter l'ensemble de vos données personnelles au format JSON.
        </p>
        <Button
          variant="secondary"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? 'Export en cours...' : 'Exporter mes données'}
        </Button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-700 mb-2">Zone de danger</h2>
        <p className="text-sm text-gray-600 mb-4">
          La suppression de votre compte est irréversible. Vos données personnelles seront anonymisées
          mais l'historique des transactions sera conservé à des fins comptables.
        </p>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
        >
          Supprimer mon compte
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer mon compte"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cette action est <strong>irréversible</strong>. Votre compte sera désactivé et vos
            données personnelles seront anonymisées.
          </p>
          <p className="text-sm text-gray-600">
            Vos données seront exportées automatiquement avant la suppression.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleExportAndDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Confirmer la suppression'}
            </Button>
          </div>
          {deleteMutation.isError && (
            <p className="text-sm text-red-600">Erreur lors de la suppression du compte.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
