import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search, CreditCard, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useRfidScanner } from '@/hooks';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { userService, departmentService } from '@/services';
import type { User, Department, TableColumn, CreateUserForm } from '@/types';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'manager', 'worker']),
  departmentId: z.string().optional(),
  rfidTag: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const Users = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const {
    startScan,
    cancelScan,
    isScanning,
    error: scanError,
    isDeviceConnected,
  } = useRfidScanner({
    onScanSuccess: (uid) => {
      setValue('rfidTag', uid);
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, deptResponse] = await Promise.all([
        userService.getAll({ limit: 100 }),
        departmentService.getAll({ limit: 100 }),
      ]);
      setUsers(usersResponse.data);
      setDepartments(deptResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId || undefined,
        rfidTag: user.rfidTag || undefined,
      });
    } else {
      setSelectedUser(null);
      reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'worker',
        departmentId: '',
        rfidTag: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    reset();
    cancelScan(); // Cancel any ongoing RFID scan
  };

  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (selectedUser) {
        const updated = await userService.update(selectedUser.id, data);
        setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await userService.create(data as CreateUserForm);
        setUsers([...users, created]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userService.delete(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<User>[] = [
    {
      key: 'firstName',
      header: t('users.firstName'),
      render: (user) => `${user.firstName} ${user.lastName}`,
    },
    {
      key: 'email',
      header: t('users.email'),
    },
    {
      key: 'role',
      header: t('users.role'),
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.role === 'admin'
              ? 'bg-red-100 text-red-800'
              : user.role === 'manager'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {t(`users.roles.${user.role}`)}
        </span>
      ),
    },
    {
      key: 'departmentId',
      header: t('users.department'),
      render: (user) => {
        const dept = departments.find((d) => d.id === user.departmentId);
        return dept?.name || t('users.noDepartment');
      },
    },
    {
      key: 'rfidTag',
      header: t('users.rfidTag'),
      render: (user) => user.rfidTag || '-',
    },
    {
      key: 'isActive',
      header: t('common.status'),
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(user);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteModal(user);
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
            {t('users.title')}
          </h1>
          <p className="text-windows-textSecondary mt-1">
            {users.length} {t('nav.users').toLowerCase()}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          {t('users.addUser')}
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
          data={filteredUsers}
          columns={columns}
          keyExtractor={(user) => user.id}
          isLoading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? t('users.editUser') : t('users.addUser')}
        size="lg"
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('users.firstName')}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label={t('users.lastName')}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <Input
            label={t('users.email')}
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          {!selectedUser && (
            <Input
              label={t('auth.password')}
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
          <Select
            label={t('users.role')}
            options={[
              { value: 'admin', label: t('users.roles.admin') },
              { value: 'manager', label: t('users.roles.manager') },
              { value: 'worker', label: t('users.roles.worker') },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />
          <Select
            label={t('users.department')}
            options={[
              { value: '', label: t('users.noDepartment') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-windows-text">
              {t('users.rfidTag')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  error={errors.rfidTag?.message || scanError || undefined}
                  {...register('rfidTag')}
                />
              </div>
              <Button
                type="button"
                variant={isScanning ? 'secondary' : 'primary'}
                onClick={isScanning ? cancelScan : startScan}
                disabled={!isDeviceConnected && !isScanning}
                className="whitespace-nowrap"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('rfid.scanning')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('rfid.scanCard')}
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {isDeviceConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">{t('rfid.deviceConnected')}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">{t('rfid.noDevice')}</span>
                </>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('users.deleteUser')}
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
        <p className="text-windows-text">{t('users.deleteConfirm')}</p>
        {selectedUser && (
          <p className="text-windows-textSecondary mt-2">
            {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Users;
