import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import type { User, UserRole, UserAdminUpdate } from '@/types';

const ROLE_LABELS: Record<UserRole, { label: string; className: string }> = {
  depositor: { label: 'Déposant', className: 'bg-gray-100 text-gray-800' },
  volunteer: { label: 'Bénévole', className: 'bg-blue-100 text-blue-800' },
  manager: { label: 'Gestionnaire', className: 'bg-purple-100 text-purple-800' },
  administrator: { label: 'Administrateur', className: 'bg-red-100 text-red-800' },
};

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'depositor', label: 'Déposant' },
  { value: 'volunteer', label: 'Bénévole' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'administrator', label: 'Administrateur' },
];

const ROLE_EDIT_OPTIONS = [
  { value: 'depositor', label: 'Déposant' },
  { value: 'volunteer', label: 'Bénévole' },
  { value: 'manager', label: 'Gestionnaire' },
  { value: 'administrator', label: 'Administrateur' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function UsersManagementPage() {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state for edit modal
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('depositor');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsLocalResident, setFormIsLocalResident] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { role: roleFilter, search: debouncedSearch, page }],
    queryFn: () => usersApi.listUsers({
      role: roleFilter || undefined,
      search: debouncedSearch || undefined,
      page,
      limit: 20,
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserAdminUpdate }) =>
      usersApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
      setSuccessMessage('Utilisateur mis à jour avec succès.');
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de la mise à jour.');
    },
  });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormFirstName(user.firstName);
    setFormLastName(user.lastName);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormIsActive(user.isActive);
    setFormIsLocalResident(user.isLocalResident);
    setErrorMessage('');
  };

  const handleSave = () => {
    if (!editingUser) return;

    const updates: UserAdminUpdate = {};
    if (formFirstName !== editingUser.firstName) updates.firstName = formFirstName;
    if (formLastName !== editingUser.lastName) updates.lastName = formLastName;
    if (formEmail !== editingUser.email) updates.email = formEmail;
    if ((formPhone || null) !== editingUser.phone) updates.phone = formPhone || null;
    if (formRole !== editingUser.role) updates.role = formRole;
    if (formIsActive !== editingUser.isActive) updates.isActive = formIsActive;
    if (formIsLocalResident !== editingUser.isLocalResident) updates.isLocalResident = formIsLocalResident;

    if (Object.keys(updates).length === 0) {
      setEditingUser(null);
      return;
    }

    updateMutation.mutate({ userId: editingUser.id, data: updates });
  };

  const users = data?.items || [];
  const totalPages = data?.pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultez et modifiez les comptes utilisateurs.
          {data && ` ${data.total} utilisateur${data.total > 1 ? 's' : ''} au total.`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            <>
            {/* Mobile card layout */}
            <div className="md:hidden divide-y divide-gray-200">
              {users.map((user) => {
                const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.depositor;
                return (
                  <div key={user.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${roleInfo.className}`}>
                          {roleInfo.label}
                        </span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Résident : {user.isLocalResident ? 'Oui' : 'Non'}</span>
                      <span>Connexion : {formatDate(user.lastLoginAt)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Modifier
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résident</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.depositor;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${roleInfo.className}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.isLocalResident ? 'Oui' : 'Non'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Modifier l'utilisateur"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={formFirstName}
              onChange={(e) => setFormFirstName(e.target.value)}
              required
            />
            <Input
              label="Nom"
              value={formLastName}
              onChange={(e) => setFormLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />

          <Input
            label="Téléphone"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />

          <Select
            label="Rôle"
            options={ROLE_EDIT_OPTIONS}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value as UserRole)}
          />

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Compte actif</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formIsLocalResident}
                onChange={(e) => setFormIsLocalResident(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Résident local</span>
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              disabled={!formFirstName.trim() || !formLastName.trim() || !formEmail.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
