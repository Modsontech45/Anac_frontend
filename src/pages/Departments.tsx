import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { departmentService, userService } from '@/services';
import type { Department, User, TableColumn, CreateDepartmentForm } from '@/types';

const departmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

const Departments = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [deptResponse, usersResponse] = await Promise.all([
        departmentService.getAll({ limit: 100 }),
        userService.getAll({ role: 'manager', limit: 100 }),
      ]);
      setDepartments(deptResponse.data);
      setManagers(usersResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setSelectedDepartment(department);
      reset({
        name: department.name,
        description: department.description || '',
        managerId: department.managerId || '',
      });
    } else {
      setSelectedDepartment(null);
      reset({
        name: '',
        description: '',
        managerId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
    reset();
  };

  const handleOpenDeleteModal = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDepartment(null);
  };

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      if (selectedDepartment) {
        const updated = await departmentService.update(selectedDepartment.id, {
          ...data,
          managerId: data.managerId || null,
        });
        setDepartments(departments.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await departmentService.create(data as CreateDepartmentForm);
        setDepartments([...departments, created]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save department:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    try {
      await departmentService.delete(selectedDepartment.id);
      setDepartments(departments.filter((d) => d.id !== selectedDepartment.id));
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Failed to delete department:', error);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<Department>[] = [
    {
      key: 'name',
      header: t('departments.name'),
    },
    {
      key: 'description',
      header: t('departments.description'),
      render: (dept) => dept.description || '-',
    },
    {
      key: 'managerId',
      header: t('departments.manager'),
      render: (dept) => {
        const manager = managers.find((m) => m.id === dept.managerId);
        return manager ? `${manager.firstName} ${manager.lastName}` : t('departments.noManager');
      },
    },
    {
      key: 'employeeCount',
      header: t('departments.employeeCount'),
      render: (dept) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-windows-textSecondary" />
          <span>{dept.employeeCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (dept) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(dept);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteModal(dept);
            }}
          >
            <Trash2 className="w-4 h-4 text-windows-error" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">
            {t('departments.title')}
          </h1>
          <p className="text-windows-textSecondary mt-1">
            {departments.length} {t('nav.departments').toLowerCase()}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          {t('departments.addDepartment')}
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-windows-textSecondary" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-windows-text placeholder-windows-textSecondary"
          />
        </div>
      </Card>

      {/* Table */}
      <Card noPadding>
        <Table
          data={filteredDepartments}
          columns={columns}
          keyExtractor={(dept) => dept.id}
          isLoading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDepartment ? t('departments.editDepartment') : t('departments.addDepartment')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
            >
              {t('common.save')}
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label={t('departments.name')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('departments.description')}
            error={errors.description?.message}
            {...register('description')}
          />
          <Select
            label={t('departments.manager')}
            options={[
              { value: '', label: t('departments.noManager') },
              ...managers.map((m) => ({
                value: m.id,
                label: `${m.firstName} ${m.lastName}`,
              })),
            ]}
            error={errors.managerId?.message}
            {...register('managerId')}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('departments.deleteDepartment')}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseDeleteModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-windows-text">{t('departments.deleteConfirm')}</p>
        {selectedDepartment && (
          <p className="text-windows-textSecondary mt-2">
            {selectedDepartment.name}
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Departments;
