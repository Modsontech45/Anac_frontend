import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { feeStructureService } from '@/services';
import type { FeeStructure } from '@/types';

const feeStructureSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  percentage: z.coerce.number().min(0).max(100),
  academicYear: z.string().min(1, 'Année académique requise').regex(/^\d{4}-\d{4}$/, 'Format: 2024-2025'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate: z.string().min(1, 'Date de fin requise'),
  totalAmount: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive('Montant invalide').optional()
  ),
});

type FeeStructureFormData = {
  name: string;
  percentage: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  totalAmount?: number;
};

const FeeStructures = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FeeStructureFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(feeStructureSchema) as any,
  });

  const watchedPercentage = useWatch({ control, name: 'percentage' });
  const watchedTotalAmount = useWatch({ control, name: 'totalAmount' });
  const previewAmount = (watchedPercentage && watchedTotalAmount)
    ? Math.round((Number(watchedPercentage) * Number(watchedTotalAmount) / 100) * 100) / 100
    : null;

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async () => {
    try {
      const data = await feeStructureService.getAll();
      setStructures(data);
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (structure?: FeeStructure) => {
    if (structure) {
      setSelectedStructure(structure);
      reset({
        name: structure.name,
        percentage: structure.percentage,
        academicYear: structure.academicYear,
        startDate: structure.startDate,
        endDate: structure.endDate,
        totalAmount: structure.totalAmount ?? undefined,
      });
    } else {
      setSelectedStructure(null);
      reset({ name: '', percentage: 0, academicYear: '', startDate: '', endDate: '', totalAmount: undefined });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStructure(null);
    reset();
  };

  const onSubmit = async (data: FeeStructureFormData) => {
    try {
      const payload = {
        ...data,
        totalAmount: data.totalAmount ? Number(data.totalAmount) : null,
      };
      if (selectedStructure) {
        const updated = await feeStructureService.update(selectedStructure.id, payload);
        setStructures(structures.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await feeStructureService.create(payload);
        setStructures([...structures, created]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save fee structure:', error);
    }
  };

  const handleForceActivate = async (structure: FeeStructure) => {
    try {
      const updated = await feeStructureService.forceActivate(structure.id);
      setStructures(structures.map((s) => {
        if (s.academicYear === updated.academicYear) {
          return { ...s, isForcedActive: s.id === updated.id };
        }
        return s;
      }));
      await fetchStructures();
    } catch (error) {
      console.error('Failed to activate fee structure:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedStructure) return;
    try {
      await feeStructureService.delete(selectedStructure.id);
      setStructures(structures.filter((s) => s.id !== selectedStructure.id));
      setIsDeleteModalOpen(false);
      setSelectedStructure(null);
    } catch (error) {
      console.error('Failed to delete fee structure:', error);
    }
  };

  const getStatusBadge = (structure: FeeStructure) => {
    if (structure.isCurrentlyActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          {structure.isForcedActive ? 'Actif (forcé)' : 'Actif'}
        </span>
      );
    }
    const now = new Date();
    const start = new Date(structure.startDate);
    if (start > now) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">À venir</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Passé</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">Tranches de Frais</h1>
          <p className="text-windows-textSecondary mt-1">{structures.length} tranche(s)</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => handleOpenModal()}>
          Nouvelle Tranche
        </Button>
      </div>

      <Card noPadding>
        {isLoading ? (
          <div className="p-8 text-center text-windows-textSecondary">Chargement...</div>
        ) : structures.length === 0 ? (
          <div className="p-8 text-center text-windows-textSecondary">Aucune tranche créée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-windows-border bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">%</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Total annuel</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Montant dû</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Année</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Période</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((structure) => (
                  <tr key={structure.id} className="border-b border-windows-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-windows-text">{structure.name}</td>
                    <td className="px-4 py-3 text-windows-text">{structure.percentage}%</td>
                    <td className="px-4 py-3 text-windows-textSecondary">
                      {structure.totalAmount ? `${structure.totalAmount.toLocaleString()} ${structure.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-windows-text">
                      {structure.amountDue ? `${structure.amountDue.toLocaleString()} ${structure.currency}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-windows-text">{structure.academicYear}</td>
                    <td className="px-4 py-3 text-windows-textSecondary text-xs">
                      {structure.startDate} → {structure.endDate}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(structure)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!structure.isCurrentlyActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleForceActivate(structure)}
                            title="Forcer l'activation"
                          >
                            <Zap className="w-4 h-4 text-yellow-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(structure)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedStructure(structure); setIsDeleteModalOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4 text-windows-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedStructure ? 'Modifier la Tranche' : 'Nouvelle Tranche de Frais'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Annuler</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Nom de la tranche"
            placeholder="ex: 1ère Tranche"
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Frais annuels totaux (XAF)"
              type="number"
              step="1"
              min="0"
              placeholder="ex: 500000"
              error={errors.totalAmount?.message}
              {...register('totalAmount')}
            />
            <Input
              label="Pourcentage (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              error={errors.percentage?.message}
              {...register('percentage')}
            />
          </div>
          {previewAmount !== null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-windows-accent/10 border border-windows-accent/30 rounded-windows">
              <span className="text-sm text-windows-textSecondary">Montant dû pour cette tranche :</span>
              <span className="text-sm font-semibold text-windows-accent">
                {previewAmount.toLocaleString()} XAF
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Année académique"
              placeholder="2024-2025"
              error={errors.academicYear?.message}
              {...register('academicYear')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              label="Date de fin"
              type="date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedStructure(null); }}
        title="Supprimer la tranche"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIsDeleteModalOpen(false); setSelectedStructure(null); }}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </>
        }
      >
        <p>Êtes-vous sûr de vouloir supprimer la tranche <strong>{selectedStructure?.name}</strong> ?</p>
        <p className="text-windows-textSecondary text-sm mt-1">Cette action supprimera aussi les paiements associés.</p>
      </Modal>
    </div>
  );
};

export default FeeStructures;
