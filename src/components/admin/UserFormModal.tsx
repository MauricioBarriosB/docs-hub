import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserRole,
} from '@/api/types';

interface UserFormModalProps {
  isOpen: boolean;
  /** User being edited, or null when creating. */
  user: User | null;
  isLoading?: boolean;
  onClose: () => void;
  onCreate: (payload: CreateUserRequest) => void;
  onUpdate: (id: number, payload: UpdateUserRequest) => void;
}

const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
  { key: 'user', label: 'Usuario' },
  { key: 'admin', label: 'Administrador' },
];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Create/edit modal for users. Password is required on create, optional on edit. */
export function UserFormModal({
  isOpen,
  user,
  isLoading = false,
  onClose,
  onCreate,
  onUpdate,
}: UserFormModalProps) {
  const isEdit = user !== null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setRole(user?.role ?? 'user');
    setPassword('');
    setTouched(false);
  }, [isOpen, user]);

  const nameInvalid = touched && name.trim() === '';
  const emailInvalid = touched && !isValidEmail(email.trim());
  // Backend requires >= 8 chars; required on create, optional (but validated) on edit.
  const passwordInvalid = touched && (isEdit ? password !== '' && password.length < 8 : password.length < 8);

  function handleSubmit() {
    setTouched(true);
    if (name.trim() === '' || !isValidEmail(email.trim())) return;
    if (!isEdit && password.length < 8) return;
    if (isEdit && password !== '' && password.length < 8) return;

    if (isEdit && user) {
      const payload: UpdateUserRequest = {
        name: name.trim(),
        email: email.trim(),
        role,
      };
      if (password !== '') payload.password = password;
      onUpdate(user.id, payload);
    } else {
      onCreate({ name: name.trim(), email: email.trim(), role, password });
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDismissable={!isLoading}>
      <ModalContent>
        <ModalHeader>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Nombre"
            value={name}
            onValueChange={setName}
            onBlur={() => setTouched(true)}
            isRequired
            isInvalid={nameInvalid}
            errorMessage={nameInvalid ? 'El nombre es obligatorio.' : undefined}
          />
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onValueChange={setEmail}
            onBlur={() => setTouched(true)}
            isRequired
            isInvalid={emailInvalid}
            errorMessage={emailInvalid ? 'Introduce un correo válido.' : undefined}
          />
          <Select
            label="Rol"
            selectedKeys={[role]}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === 'user' || next === 'admin') setRole(next);
            }}
            disallowEmptySelection
          >
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          <Input
            label={isEdit ? 'Nueva contraseña' : 'Contraseña'}
            type="password"
            value={password}
            onValueChange={setPassword}
            isRequired={!isEdit}
            isInvalid={passwordInvalid}
            errorMessage={passwordInvalid ? 'Mínimo 8 caracteres.' : undefined}
            description={isEdit ? 'Déjalo vacío para mantener la contraseña actual.' : undefined}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
