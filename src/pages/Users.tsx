import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search, CreditCard, Loader2, Wifi, WifiOff, Clock, Camera, X } from 'lucide-react';
import { useRfidScanner, useOrgLabels } from '@/hooks';
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
  memberType: z.enum(['student', 'teacher', 'member', 'employee']).optional().nullable(),
});

type UserFormData = z.infer<typeof userSchema>;

const Users = () => {
  const { t } = useTranslation();
  const orgLabels = useOrgLabels();
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

  const [selectedDeviceUid, setSelectedDeviceUid] = useState<string>('');

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    startScan,
    cancelScan,
    isScanning,
    error: scanError,
    isDeviceConnected,
    connectedDevices,
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
        memberType: user.memberType || undefined,
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
    cancelScan();
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: { target: HTMLInputElement }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async (userId: string) => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const updated = await userService.uploadAvatar(userId, avatarFile);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async (userId: string) => {
    try {
      const updated = await userService.deleteAvatar(userId);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
    } catch (error) {
      console.error('Failed to delete avatar:', error);
    }
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
      key: 'avatarUrl',
      header: '',
      render: (user) => (
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-gray-400">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </span>
          )}
        </div>
      ),
      width: '48px',
    },
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
          {orgLabels.roleLabels[user.role as 'admin' | 'manager' | 'worker'] ?? user.role}
        </span>
      ),
    },
    ...(orgLabels.showMemberType ? [{
      key: 'memberType' as keyof User,
      header: 'Type',
      render: (user: User) => user.memberType ? (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.memberType === 'student' ? 'bg-indigo-100 text-indigo-800' :
          user.memberType === 'teacher' ? 'bg-emerald-100 text-emerald-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user.memberType === 'student' ? 'Élève' : user.memberType === 'teacher' ? 'Enseignant' : user.memberType}
        </span>
      ) : <span className="text-windows-textSecondary">-</span>,
    }] : []),
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
      key: 'totalHoursWorked',
      header: t('users.totalHours'),
      render: (user) => (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-windows-textSecondary" />
          <span>{user.totalHoursWorked?.toFixed(1) || '0.0'} h</span>
        </div>
      ),
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
            {orgLabels.membersLabel}
          </h1>
          <p className="text-windows-textSecondary mt-1">
            {users.length} {orgLabels.membersLabel.toLowerCase()}
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
          {/* Avatar upload section (edit mode only) */}
          {selectedUser && (
            <div className="flex items-center gap-4 pb-3 border-b border-windows-border">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 ring-2 ring-windows-border">
                {avatarPreview || selectedUser.avatarUrl ? (
                  <img
                    src={avatarPreview || selectedUser.avatarUrl!}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {avatarFile ? (
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    isLoading={isUploadingAvatar}
                    onClick={() => handleAvatarUpload(selectedUser.id)}
                  >
                    Enregistrer la photo
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Changer la photo
                  </Button>
                )}
                {(selectedUser.avatarUrl || avatarPreview) && !avatarFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => handleAvatarDelete(selectedUser.id)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Supprimer
                  </Button>
                )}
                {avatarFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          )}

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
              { value: 'admin', label: orgLabels.roleLabels.admin },
              { value: 'manager', label: orgLabels.roleLabels.manager },
              { value: 'worker', label: orgLabels.roleLabels.worker },
            ]}
            error={errors.role?.message}
            {...register('role')}
          />
          {orgLabels.showMemberType && (
            <Select
              label="Type de membre"
              options={[
                { value: '', label: '-- Sélectionner --' },
                ...orgLabels.memberTypeOptions,
              ]}
              error={errors.memberType?.message}
              {...register('memberType')}
            />
          )}
          <Select
            label={t('users.department')}
            options={[
              { value: '', label: t('users.noDepartment') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-windows-text">
              {t('users.rfidTag')}
            </label>

            {/* Device Selector */}
            {connectedDevices.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs font-medium text-windows-textSecondary mb-1">
                  {t('rfid.selectDevice')}
                </label>
                <select
                  value={selectedDeviceUid}
                  onChange={(e) => setSelectedDeviceUid(e.target.value)}
                  disabled={isScanning}
                  className="w-full px-3 py-2 text-sm border border-windows-border rounded-windows bg-windows-surface text-windows-text focus:outline-none focus:ring-2 focus:ring-windows-accent/50"
                >
                  <option value="">{t('rfid.anyDevice')}</option>
                  {connectedDevices.map((deviceUid) => (
                    <option key={deviceUid} value={deviceUid}>
                      {deviceUid}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                onClick={() => isScanning ? cancelScan() : startScan(selectedDeviceUid || undefined)}
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
                  <span className="text-green-600">
                    {t('rfid.deviceConnected')} ({connectedDevices.length} {t('rfid.devicesOnline')})
                  </span>
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
