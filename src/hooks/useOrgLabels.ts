import { useAuthStore } from '@/store/authStore';
import type { OrganizationType } from '@/types';

export interface OrgLabels {
  memberLabel: string;
  membersLabel: string;
  staffLabel: string | null;
  showPayroll: boolean;
  showFeeStructures: boolean;
  showMemberships: boolean;
  showMemberType: boolean;
  memberTypeOptions: { value: string; label: string }[];
  roleLabels: { admin: string; manager: string; worker: string };
}

const labelMap: Record<OrganizationType, OrgLabels> = {
  school: {
    memberLabel: 'Élève',
    membersLabel: 'Élèves & Enseignants',
    staffLabel: 'Enseignant',
    showPayroll: false,
    showFeeStructures: true,
    showMemberships: false,
    showMemberType: true,
    memberTypeOptions: [
      { value: 'student', label: 'Élève' },
      { value: 'teacher', label: 'Enseignant' },
    ],
    roleLabels: { admin: 'Administrateur', manager: 'Enseignant Principal', worker: 'Élève' },
  },
  gym: {
    memberLabel: 'Membre',
    membersLabel: 'Membres',
    staffLabel: null,
    showPayroll: false,
    showFeeStructures: false,
    showMemberships: true,
    showMemberType: true,
    memberTypeOptions: [{ value: 'member', label: 'Membre' }],
    roleLabels: { admin: 'Administrateur', manager: 'Gérant', worker: 'Membre' },
  },
  enterprise: {
    memberLabel: 'Employé',
    membersLabel: 'Employés',
    staffLabel: null,
    showPayroll: true,
    showFeeStructures: false,
    showMemberships: false,
    showMemberType: true,
    memberTypeOptions: [{ value: 'employee', label: 'Employé' }],
    roleLabels: { admin: 'Administrateur', manager: 'Manager', worker: 'Employé' },
  },
};

export const useOrgLabels = (): OrgLabels => {
  const { organizationType } = useAuthStore();
  return labelMap[organizationType ?? 'enterprise'];
};

export default useOrgLabels;
