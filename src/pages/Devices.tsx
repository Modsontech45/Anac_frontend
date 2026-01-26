import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search, Wifi, WifiOff } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { deviceService, departmentService } from '@/services';
import type { Device, Department, TableColumn, CreateDeviceForm } from '@/types';

const deviceSchema = z.object({
  name: z.string().min(1),
  serialNumber: z.string().min(1),
  location: z.string().min(1),
  departmentId: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

const Devices = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesResponse, deptResponse] = await Promise.all([
        deviceService.getAll({ limit: 100 }),
        departmentService.getAll({ limit: 100 }),
      ]);
      setDevices(devicesResponse.data);
      setDepartments(deptResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (device?: Device) => {
    if (device) {
      setSelectedDevice(device);
      reset({
        name: device.name,
        serialNumber: device.serialNumber,
        location: device.location,
        departmentId: device.departmentId || '',
      });
    } else {
      setSelectedDevice(null);
      reset({
        name: '',
        serialNumber: '',
        location: '',
        departmentId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    reset();
  };

  const handleOpenDeleteModal = (device: Device) => {
    setSelectedDevice(device);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedDevice(null);
  };

  const onSubmit = async (data: DeviceFormData) => {
    try {
      if (selectedDevice) {
        const updated = await deviceService.update(selectedDevice.id, {
          ...data,
          departmentId: data.departmentId || null,
        });
        setDevices(devices.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await deviceService.create(data as CreateDeviceForm);
        setDevices([...devices, created]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save device:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    try {
      await deviceService.delete(selectedDevice.id);
      setDevices(devices.filter((d) => d.id !== selectedDevice.id));
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatLastPing = (lastPing: string | null) => {
    if (!lastPing) return '-';
    const date = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Il y a quelques secondes';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('fr-FR');
  };

  const columns: TableColumn<Device>[] = [
    {
      key: 'name',
      header: t('devices.name'),
    },
    {
      key: 'serialNumber',
      header: t('devices.serialNumber'),
      render: (device) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
          {device.serialNumber}
        </code>
      ),
    },
    {
      key: 'location',
      header: t('devices.location'),
    },
    {
      key: 'departmentId',
      header: t('devices.department'),
      render: (device) => {
        const dept = departments.find((d) => d.id === device.departmentId);
        return dept?.name || t('devices.noDepartment');
      },
    },
    {
      key: 'isOnline',
      header: t('common.status'),
      render: (device) => (
        <div className="flex items-center gap-2">
          {device.isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600">{t('common.online')}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-600">{t('common.offline')}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'lastPing',
      header: t('devices.lastPing'),
      render: (device) => formatLastPing(device.lastPing),
    },
    {
      key: 'firmwareVersion',
      header: t('devices.firmwareVersion'),
      render: (device) => device.firmwareVersion || '-',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (device) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(device);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDeleteModal(device);
            }}
          >
            <Trash2 className="w-4 h-4 text-windows-error" />
          </Button>
        </div>
      ),
    },
  ];

  const onlineCount = devices.filter((d) => d.isOnline).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-windows-text">
            {t('devices.title')}
          </h1>
          <p className="text-windows-textSecondary mt-1">
            {devices.length} {t('nav.devices').toLowerCase()} ({onlineCount}{' '}
            {t('common.online').toLowerCase()})
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenModal()}
        >
          {t('devices.addDevice')}
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
          data={filteredDevices}
          columns={columns}
          keyExtractor={(device) => device.id}
          isLoading={isLoading}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedDevice ? t('devices.editDevice') : t('devices.addDevice')}
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
            label={t('devices.name')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('devices.serialNumber')}
            placeholder="ESP32-XXX"
            error={errors.serialNumber?.message}
            disabled={!!selectedDevice}
            {...register('serialNumber')}
          />
          <Input
            label={t('devices.location')}
            error={errors.location?.message}
            {...register('location')}
          />
          <Select
            label={t('devices.department')}
            options={[
              { value: '', label: t('devices.noDepartment') },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
            error={errors.departmentId?.message}
            {...register('departmentId')}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title={t('devices.deleteDevice')}
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
        <p className="text-windows-text">{t('devices.deleteConfirm')}</p>
        {selectedDevice && (
          <p className="text-windows-textSecondary mt-2">
            {selectedDevice.name} ({selectedDevice.serialNumber})
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Devices;
