import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Search, Plus, RotateCcw } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { feeStructureService, studentPaymentService } from '@/services';
import type { FeeStructure, StudentWithPaymentStatus } from '@/types';

type StatusFilter = 'all' | 'paid' | 'partial' | 'unpaid';

const formatAmount = (amount: number, currency: string) =>
  `${amount.toLocaleString('fr-FR')} ${currency}`;

const StatusBadge = ({ student }: { student: StudentWithPaymentStatus }) => {
  if (student.hasPaid) {
    return (
      <span className="flex items-center gap-1 text-green-700 font-medium">
        <CheckCircle className="w-4 h-4" /> Payé
      </span>
    );
  }
  if (student.isPartial) {
    return (
      <span className="flex items-center gap-1 text-orange-600 font-medium">
        <Clock className="w-4 h-4" /> Partiel
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-red-600 font-medium">
      <XCircle className="w-4 h-4" /> Non payé
    </span>
  );
};

const ProgressBar = ({ student }: { student: StudentWithPaymentStatus }) => {
  if (!student.amountDue || student.amountDue === 0) {
    // No amount set — show simple paid/unpaid
    return student.hasPaid ? (
      <span className="text-xs text-green-600">Payé</span>
    ) : (
      <span className="text-xs text-windows-textSecondary">-</span>
    );
  }

  const pct = Math.min(100, Math.round((student.totalPaid / student.amountDue) * 100));
  const barColor = student.hasPaid
    ? 'bg-green-500'
    : student.isPartial
    ? 'bg-orange-400'
    : 'bg-gray-300';

  return (
    <div className="min-w-[120px]">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-windows-textSecondary">
          {formatAmount(student.totalPaid, student.currency)}
        </span>
        <span className="text-windows-textSecondary font-medium">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {student.remainingAmount !== null && student.remainingAmount > 0 && (
        <p className="text-xs text-orange-600 mt-0.5">
          Reste: {formatAmount(student.remainingAmount, student.currency)}
        </p>
      )}
    </div>
  );
};

const StudentPayments = () => {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string>('');
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);
  const [students, setStudents] = useState<StudentWithPaymentStatus[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithPaymentStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Add payment modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPaymentStatus | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Unmark all confirm modal
  const [isUnmarkAllModalOpen, setIsUnmarkAllModalOpen] = useState(false);
  const [unmarkTarget, setUnmarkTarget] = useState<StudentWithPaymentStatus | null>(null);
  const [isUnmarking, setIsUnmarking] = useState(false);

  useEffect(() => {
    loadStructures();
  }, []);

  useEffect(() => {
    if (selectedStructureId) {
      const s = structures.find((x) => x.id === selectedStructureId) || null;
      setSelectedStructure(s);
      loadStudents();
    } else {
      setSelectedStructure(null);
      setStudents([]);
    }
  }, [selectedStructureId]);

  useEffect(() => {
    let filtered = students;
    if (statusFilter === 'paid') filtered = filtered.filter((s) => s.hasPaid);
    if (statusFilter === 'partial') filtered = filtered.filter((s) => s.isPartial);
    if (statusFilter === 'unpaid') filtered = filtered.filter((s) => !s.hasPaid && !s.isPartial);
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  }, [students, statusFilter, searchTerm]);

  const loadStructures = async () => {
    try {
      const data = await feeStructureService.getAll();
      setStructures(data);
      const active = data.find((s) => s.isCurrentlyActive);
      if (active) setSelectedStructureId(active.id);
    } catch (error) {
      console.error('Failed to load fee structures:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedStructureId) return;
    setIsLoading(true);
    try {
      const data = await studentPaymentService.getStudentsWithStatus(selectedStructureId);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openMarkModal = (student: StudentWithPaymentStatus) => {
    setSelectedStudent(student);
    // Pre-fill remaining amount if known
    if (student.remainingAmount !== null && student.remainingAmount > 0) {
      setAmountPaid(String(student.remainingAmount));
    } else {
      setAmountPaid('');
    }
    setNotes('');
    setSubmitError('');
    setIsMarkModalOpen(true);
  };

  const closeMarkModal = () => {
    setIsMarkModalOpen(false);
    setSelectedStudent(null);
    setAmountPaid('');
    setNotes('');
    setSubmitError('');
  };

  const handleMarkPaid = async () => {
    if (!selectedStudent || !selectedStructureId) return;
    const amount = parseFloat(amountPaid);
    if (!amountPaid || isNaN(amount) || amount <= 0) {
      setSubmitError('Veuillez entrer un montant valide.');
      return;
    }
    // Warn if amount exceeds remaining
    if (
      selectedStudent.remainingAmount !== null &&
      amount > selectedStudent.remainingAmount + 0.01
    ) {
      setSubmitError(
        `Le montant dépasse le restant dû (${formatAmount(selectedStudent.remainingAmount, selectedStudent.currency)}).`
      );
      return;
    }
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await studentPaymentService.markPaid({
        userId: selectedStudent.userId,
        feeStructureId: selectedStructureId,
        amountPaid: amount,
        notes: notes || undefined,
      });
      await loadStudents();
      closeMarkModal();
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || 'Erreur lors du paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUnmarkAll = (student: StudentWithPaymentStatus) => {
    setUnmarkTarget(student);
    setIsUnmarkAllModalOpen(true);
  };

  const handleUnmarkAll = async () => {
    if (!unmarkTarget || !selectedStructureId) return;
    setIsUnmarking(true);
    try {
      await studentPaymentService.unmarkAll(unmarkTarget.userId, selectedStructureId);
      await loadStudents();
      setIsUnmarkAllModalOpen(false);
      setUnmarkTarget(null);
    } catch (error) {
      console.error('Failed to unmark payments:', error);
    } finally {
      setIsUnmarking(false);
    }
  };

  // Summary stats
  const paidCount = students.filter((s) => s.hasPaid).length;
  const partialCount = students.filter((s) => s.isPartial).length;
  const total = students.length;
  const paidPercent = total > 0 ? Math.round((paidCount / total) * 100) : 0;
  const totalCollected = students.reduce((sum, s) => sum + s.totalPaid, 0);
  const totalDue = students.reduce((sum, s) => sum + (s.amountDue ?? 0), 0);
  const currency = students[0]?.currency || 'XAF';

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">Paiements des Élèves</h1>
          <p className="text-windows-textSecondary mt-1">Suivi des paiements par tranche</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Tranche"
            options={[
              { value: '', label: '-- Sélectionner une tranche --' },
              ...structures.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.academicYear})${s.isCurrentlyActive ? ' ✓' : ''}`,
              })),
            ]}
            value={selectedStructureId}
            onChange={(e) => setSelectedStructureId(e.target.value)}
          />
          <Select
            label="Statut"
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'paid', label: 'Payé' },
              { value: 'partial', label: 'Partiel' },
              { value: 'unpaid', label: 'Non payé' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          />
          <div className="flex items-end">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-windows-textSecondary" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-windows-border rounded-windows text-sm bg-windows-surface text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent/50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Bar */}
      {selectedStructureId && total > 0 && (
        <Card className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="font-medium text-green-700">{paidCount} payés</span>
                {partialCount > 0 && (
                  <span className="font-medium text-orange-600">{partialCount} partiels</span>
                )}
                <span className="text-windows-textSecondary">
                  {total - paidCount - partialCount} non payés
                </span>
              </div>
              <span className="font-semibold text-windows-text">
                {paidCount}/{total} ({paidPercent}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            {totalDue > 0 && (
              <div className="flex justify-between text-xs text-windows-textSecondary">
                <span>
                  Collecté: <strong className="text-windows-text">{formatAmount(totalCollected, currency)}</strong>
                </span>
                <span>
                  Total dû: <strong className="text-windows-text">{formatAmount(totalDue, currency)}</strong>
                </span>
              </div>
            )}
            {selectedStructure && (
              <p className="text-xs text-windows-textSecondary">
                {selectedStructure.name} — {selectedStructure.percentage}%
                {selectedStructure.amountDue != null &&
                  ` → ${formatAmount(selectedStructure.amountDue, selectedStructure.currency)} par élève`}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Table */}
      <Card noPadding>
        {!selectedStructureId ? (
          <div className="p-8 text-center text-windows-textSecondary">
            Sélectionnez une tranche pour voir les paiements
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-windows-textSecondary">Chargement...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-windows-textSecondary">Aucun élève trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-windows-border bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Élève</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">RFID</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary w-48">Progression</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Dernier paiement</th>
                  <th className="px-4 py-3 text-left font-medium text-windows-textSecondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.userId} className="border-b border-windows-border hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-windows-text">
                      {student.studentName}
                      {student.paymentCount > 1 && (
                        <span className="ml-2 text-xs text-windows-textSecondary">
                          ({student.paymentCount} versements)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-windows-textSecondary font-mono text-xs">
                      {student.rfidTag || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge student={student} />
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar student={student} />
                    </td>
                    <td className="px-4 py-3 text-windows-textSecondary text-xs">
                      {student.lastPaidAt
                        ? new Date(student.lastPaidAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Add payment button — visible as long as student hasn't fully paid */}
                        {!student.hasPaid && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openMarkModal(student)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {student.isPartial ? 'Ajouter' : 'Marquer payé'}
                          </Button>
                        )}
                        {/* Reset all payments — visible when at least one payment exists */}
                        {student.paymentCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUnmarkAll(student)}
                            title="Annuler tous les paiements"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={closeMarkModal}
        title={
          selectedStudent?.isPartial
            ? `Ajouter un versement — ${selectedStudent?.studentName}`
            : `Marquer comme payé — ${selectedStudent?.studentName}`
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={closeMarkModal}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleMarkPaid} isLoading={isSubmitting}>
              Confirmer le paiement
            </Button>
          </>
        }
      >
        {selectedStudent && (
          <>
            {/* Progress summary in modal */}
            {selectedStudent.amountDue !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-windows p-3 mb-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-blue-700">Montant dû:</span>
                  <strong className="text-blue-900">
                    {formatAmount(selectedStudent.amountDue, selectedStudent.currency)}
                  </strong>
                </div>
                {selectedStudent.totalPaid > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-blue-700">Déjà payé:</span>
                    <strong className="text-green-700">
                      {formatAmount(selectedStudent.totalPaid, selectedStudent.currency)}
                    </strong>
                  </div>
                )}
                {selectedStudent.remainingAmount !== null && selectedStudent.remainingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Restant:</span>
                    <strong className="text-orange-700">
                      {formatAmount(selectedStudent.remainingAmount, selectedStudent.currency)}
                    </strong>
                  </div>
                )}
                {/* Mini progress bar */}
                <div className="mt-2 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((selectedStudent.totalPaid / selectedStudent.amountDue) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Input
              label="Montant du versement (XAF)"
              type="number"
              step="100"
              min="1"
              value={amountPaid}
              onChange={(e) => {
                setAmountPaid(e.target.value);
                setSubmitError('');
              }}
              placeholder="Ex: 15000"
            />

            {submitError && (
              <p className="text-red-600 text-xs mt-1">{submitError}</p>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium text-windows-text mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-windows-border rounded-windows text-sm bg-windows-surface text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent/50 resize-none"
                rows={2}
                placeholder="Observations..."
              />
            </div>
          </>
        )}
      </Modal>

      {/* Unmark All Confirm Modal */}
      <Modal
        isOpen={isUnmarkAllModalOpen}
        onClose={() => { setIsUnmarkAllModalOpen(false); setUnmarkTarget(null); }}
        title="Annuler tous les paiements"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => { setIsUnmarkAllModalOpen(false); setUnmarkTarget(null); }}
            >
              Retour
            </Button>
            <Button variant="danger" onClick={handleUnmarkAll} isLoading={isUnmarking}>
              Confirmer l'annulation
            </Button>
          </>
        }
      >
        <p className="text-windows-text">
          Voulez-vous annuler <strong>tous les paiements</strong> de{' '}
          <strong>{unmarkTarget?.studentName}</strong> pour cette tranche ?
        </p>
        {unmarkTarget && unmarkTarget.paymentCount > 0 && (
          <p className="text-sm text-windows-textSecondary mt-2">
            {unmarkTarget.paymentCount} versement(s) —{' '}
            {formatAmount(unmarkTarget.totalPaid, unmarkTarget.currency)} seront supprimés.
          </p>
        )}
        <p className="text-xs text-red-600 mt-2">Cette action est irréversible.</p>
      </Modal>
    </div>
  );
};

export default StudentPayments;
