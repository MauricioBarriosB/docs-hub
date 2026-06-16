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
  Category,
  CategoryType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/api/types';

interface CategoryFormModalProps {
  isOpen: boolean;
  /** Category being edited, or null when creating. */
  category: Category | null;
  isLoading?: boolean;
  onClose: () => void;
  onCreate: (payload: CreateCategoryRequest) => void;
  onUpdate: (id: number, payload: UpdateCategoryRequest) => void;
}

const TYPE_OPTIONS: { key: CategoryType; label: string }[] = [
  { key: 'language', label: 'Lenguaje' },
  { key: 'technology', label: 'Tecnología' },
];

/** Create/edit modal for categories. Slug is optional (server derives it). */
export function CategoryFormModal({
  isOpen,
  category,
  isLoading = false,
  onClose,
  onCreate,
  onUpdate,
}: Readonly<CategoryFormModalProps>) {
  const isEdit = category !== null;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<CategoryType>('language');
  const [icon, setIcon] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(category?.name ?? '');
    setSlug(category?.slug ?? '');
    setType(category?.type ?? 'language');
    setIcon(category?.icon ?? '');
    setTouched(false);
  }, [isOpen, category]);

  const nameInvalid = touched && name.trim() === '';

  function handleSubmit() {
    setTouched(true);
    if (name.trim() === '') return;

    const trimmedIcon = icon.trim();
    const trimmedSlug = slug.trim();

    if (isEdit && category) {
      const payload: UpdateCategoryRequest = {
        name: name.trim(),
        type,
        icon: trimmedIcon === '' ? null : trimmedIcon,
      };
      if (trimmedSlug !== '') payload.slug = trimmedSlug;
      onUpdate(category.id, payload);
    } else {
      const payload: CreateCategoryRequest = {
        name: name.trim(),
        type,
        icon: trimmedIcon === '' ? null : trimmedIcon,
      };
      if (trimmedSlug !== '') payload.slug = trimmedSlug;
      onCreate(payload);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDismissable={!isLoading}>
      <ModalContent>
        <ModalHeader>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</ModalHeader>
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
            label="Slug"
            value={slug}
            onValueChange={setSlug}
            description="Opcional. Si se deja vacío, se genera a partir del nombre."
          />
          <Select
            label="Tipo"
            selectedKeys={[type]}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next === 'language' || next === 'technology') setType(next);
            }}
            disallowEmptySelection
          >
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.key}>{option.label}</SelectItem>
            ))}
          </Select>
          <Input
            label="Icono"
            value={icon}
            onValueChange={setIcon}
            description="Opcional. Nombre o URL del icono."
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
