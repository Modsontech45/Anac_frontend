import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { membershipService, userService } from '@/services';
import type { GymMembership, User } from '@/types';

const createMembershipSchema = z.object({
  userId: z.string().uuid('Sélectionnez un membre'),
  planType: z.enum(['daily', 'monthly']),
  startDate: z.string().min(1, 'Date de début requise'),
  amountPaid: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive().optional()
  ),
  notes: z.string().optional(),
});

const renewSchema = z.object({
  startDate: z.string().min(1, 'Date requise'),
  amountPaid: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive().optional()
  ),
  notes: z.string().optional(),
});

type CreateMembershipFormData = {
  userId: string;
  planType: 'daily' | 'monthly';
  startDate: string;
  amountPaid?: number;
  notes?: string;
};

type RenewFormData = {
  startDate: string;
  amountPaid?: number;
  notes?: string;
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-orange-100 text-orange-800',
  expired: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  expiring_soon: 'Expire bientôt',
  expired: 'Expiré',
};

const Memberships = () => {
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'daily' | 'monthly'>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<GymMembership | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CreateMembershipFormData>({ resolver: zodResolver(createMembershipSchema) as any });

  const {
    register: registerRenew,
    handleSubmit: handleSubmitRenew,
    reset: resetRenew,
    formState: { errors: renewErrors, isSubmitting: isRenewing },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<RenewFormData>({ resolver: zodResolver(renewSchema) as any });

  useEffect(() => {
    fetchData();
  }, [statusFilter, planFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mData, uData] = await Promise.all([
        membershipService.getAll({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          planType: planFilter !== 'all' ? planFilter : undefined,
        }),
        userService.getAll({ limit: 200 }),
      ]);
      setMemberships(mData);
      setMembers(uData.data.filter((u) => u.isActive));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateSubmit = async (data: CreateMembershipFormData) => {
    try {
      const created = await membershipService.create({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
      });
      setMemberships([created, ...memberships]);
      setIsCreateModalOpen(false);
      resetCreate();
    } catch (error) {
      console.error('Failed to create membership:', error);
    }
  };

  const onRenewSubmit = async (data: RenewFormData) => {
    if (!selectedMembership) return;
    try {
      const renewed = await membershipService.renew(selectedMembership.id, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
      });
      setMemberships(memberships.map((m) => (m.id === renewed.id ? renewed : m)));
      setIsRenewModalOpen(false);
      setSelectedMembership(null);
      resetRenew();
    } catch (error) {
      console.error('Failed to renew membership:', error);
    }
  };

  const handleOpenRenew = (membership: GymMembership) => {
    setSelectedMembership(membership);
    resetRenew({ startDate: new Date().toISOString().split('T')[0] });
    setIsRenewModalOpen(true);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">Abonnements</h1>
          <p className="text-windows-textSecondary mt-1">{memberships.length} abonnement(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
            Actualiser
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            Nouvel Abonnement
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Statut"
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'active', label: 'Actif' },
              { value: 'expiring_soon', label: 'Expire bientôt' },
              { value: 'expired', label: 'Expiré' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          />
          <Select
            label="Plan"
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'daily', label: 'Journalier' },
              { value: 'monthly', label: 'Mensuel' },
            ]}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
          />
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-8 text-center text-windows-textSecondary">Chargement...</div>
        ) : memberships.length === 0 ? (
          <div className="p-8 text-center text-windows-textSecondary">Aucun abonnement</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-windows-border bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Membre</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Début</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Fin</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Jours restants</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Montant</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} className="border-b border-windows-border hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-windows-text">{m.memberName}</div>
                      <div className="text-xs text-windows-textSecondary">{m.memberEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-windows-text capitalize">
                      {m.planType === 'daily' ? 'Journalier' : 'Mensuel'}
                    </td>
                    <td className="px-4 py-3 text-windows-textSecondary text-xs">
                      {new Date(m.startDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-windows-textSecondary text-xs">
                      {new Date(m.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-windows-text">
                      {m.status === 'expired' ? '-' : `${m.daysRemaining} j`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[m.status]}`}>
                        {statusLabels[m.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-windows-text">
                      {m.amountPaid ? `${m.amountPaid.toLocaleString()} ${m.currency}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" size="sm" onClick={() => handleOpenRenew(m)}>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Renouveler
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Membership Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetCreate(); }}
        title="Nouvel Abonnement"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsCreateModalOpen(false); resetCreate(); }}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmitCreate(onCreateSubmit)} isLoading={isCreating}>
              Créer
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Membre"
            options={[
              { value: '', label: '-- Sélectionner un membre --' },
              ...members.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
            ]}
            error={createErrors.userId?.message}
            {...registerCreate('userId')}
          />
          <Select
            label="Type de plan"
            options={[
              { value: 'daily', label: 'Journalier (1 jour)' },
              { value: 'monthly', label: 'Mensuel (30 jours)' },
            ]}
            error={createErrors.planType?.message}
            {...registerCreate('planType')}
          />
          <Input
            label="Date de début"
            type="date"
            defaultValue={today}
            error={createErrors.startDate?.message}
            {...registerCreate('startDate')}
          />
          <Input
            label="Montant payé (optionnel)"
            type="number"
            step="0.01"
            placeholder="0.00 XAF"
            error={createErrors.amountPaid?.message}
            {...registerCreate('amountPaid')}
          />
          <div>
            <label className="block text-sm font-medium text-windows-text mb-1">Notes (optionnel)</label>
            <textarea
              className="w-full px-3 py-2 border border-windows-border rounded-windows text-sm bg-windows-surface text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent/50 resize-none"
              rows={2}
              {...registerCreate('notes')}
            />
          </div>
        </form>
      </Modal>

      {/* Renew Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => { setIsRenewModalOpen(false); setSelectedMembership(null); resetRenew(); }}
        title="Renouveler l'abonnement"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsRenewModalOpen(false); resetRenew(); }}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmitRenew(onRenewSubmit)} isLoading={isRenewing}>
              Renouveler
            </Button>
          </>
        }
      >
        <p className="text-windows-textSecondary text-sm mb-4">
          Plan actuel: <strong>{selectedMembership?.planType === 'daily' ? 'Journalier' : 'Mensuel'}</strong>
          {' '}pour <strong>{selectedMembership?.memberName}</strong>
        </p>
        <form className="space-y-4">
          <Input
            label="Nouvelle date de début"
            type="date"
            defaultValue={today}
            error={renewErrors.startDate?.message}
            {...registerRenew('startDate')}
          />
          <Input
            label="Montant payé (optionnel)"
            type="number"
            step="0.01"
            placeholder="0.00 XAF"
            error={renewErrors.amountPaid?.message}
            {...registerRenew('amountPaid')}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Memberships;
