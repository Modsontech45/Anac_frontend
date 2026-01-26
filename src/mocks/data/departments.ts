import type { Department } from '@/types';

export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Informatique',
    description: 'D\u00e9partement des syst\u00e8mes informatiques',
    managerId: '2',
    employeeCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Ressources Humaines',
    description: 'Gestion du personnel et recrutement',
    managerId: '6',
    employeeCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Finance',
    description: 'Comptabilit\u00e9 et gestion financi\u00e8re',
    managerId: null,
    employeeCount: 0,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Op\u00e9rations',
    description: 'Gestion des op\u00e9rations quotidiennes',
    managerId: null,
    employeeCount: 0,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];
