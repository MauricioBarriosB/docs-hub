import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
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
  Textarea,
} from '@heroui/react';
import type { DocumentItem, UpdateDocumentRequest } from '@/api/types';
import { useCategories } from '@/hooks/useCategories';
import { formatFileSize } from '@/lib/format';

interface DocumentFormModalProps {
  isOpen: boolean;
  /** Document being edited (null while closed). */
  document: DocumentItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (id: number, payload: UpdateDocumentRequest, file?: File | null) => void;
}

/**
 * Edit a document's metadata: title, description and category tags. Status is
 * not editable here — it is governed by the approve/reject moderation actions.
 */
export function DocumentFormModal({
  isOpen,
  document,
  isLoading = false,
  onClose,
  onSubmit,
}: Readonly<DocumentFormModalProps>) {
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publisherName, setPublisherName] = useState('');
  const [writersNames, setWritersNames] = useState('');
  const [yearIssue, setYearIssue] = useState('');
  const [pagesCount, setPagesCount] = useState('');
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen || !document) return;
    setTitle(document.title);
    setDescription(document.description ?? '');
    setPublisherName(document.publisherName ?? '');
    setWritersNames(document.writersNames ?? '');
    setYearIssue(document.yearIssue != null ? String(document.yearIssue) : '');
    setPagesCount(document.pagesCount != null ? String(document.pagesCount) : '');
    setCategoryIds(new Set(document.categories.map((category) => String(category.id))));
    setFile(null);
    setTouched(false);
  }, [isOpen, document]);

  const titleInvalid = touched && title.trim() === '';

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit() {
    setTouched(true);
    if (!document || title.trim() === '') return;

    const trimmedDescription = description.trim();
    const trimmedPublisher = publisherName.trim();
    const trimmedWriters = writersNames.trim();
    const trimmedYear = yearIssue.trim();
    const trimmedPages = pagesCount.trim();
    onSubmit(
      document.id,
      {
        title: title.trim(),
        description: trimmedDescription === '' ? null : trimmedDescription,
        publisherName: trimmedPublisher === '' ? null : trimmedPublisher,
        writersNames: trimmedWriters === '' ? null : trimmedWriters,
        yearIssue: trimmedYear === '' ? null : Number(trimmedYear),
        pagesCount: trimmedPages === '' ? null : Number(trimmedPages),
        categoryIds: [...categoryIds].map(Number),
      },
      file,
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isDismissable={!isLoading}>
      <ModalContent>
        <ModalHeader>Editar documento</ModalHeader>
        <ModalBody className="gap-4">
          <Input
            label="Título"
            value={title}
            onValueChange={setTitle}
            onBlur={() => setTouched(true)}
            isRequired
            isInvalid={titleInvalid}
            errorMessage={titleInvalid ? 'El título es obligatorio.' : undefined}
          />
          <Textarea label="Descripción" value={description} onValueChange={setDescription} />
          <Input
            label="Nombre de la editorial"
            value={publisherName}
            onValueChange={setPublisherName}
          />
          <Input
            label="Nombre(s) de autor(es)"
            value={writersNames}
            onValueChange={setWritersNames}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="number"
              label="Año de publicación"
              value={yearIssue}
              onValueChange={setYearIssue}
              min={0}
            />
            <Input
              type="number"
              label="Cantidad de páginas"
              value={pagesCount}
              onValueChange={setPagesCount}
              min={0}
            />
          </div>
          <Select
            label="Categorías"
            selectionMode="multiple"
            selectedKeys={categoryIds}
            onSelectionChange={(keys) => setCategoryIds(new Set([...keys].map(String)))}
          >
            {(categories ?? []).map((category) => (
              <SelectItem key={String(category.id)}>
                {`${category.name} (${category.type === 'language' ? 'lenguaje' : 'tecnología'})`}
              </SelectItem>
            ))}
          </Select>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-file" className="text-sm font-medium">
              Reemplazar archivo
            </label>
            <input
              id="edit-file"
              type="file"
              accept=".doc,.docx,.pdf,.txt,.html,.jpg,.png"
              onChange={handleFileChange}
              className="text-sm"
            />
            {file ? (
              <span className="text-xs text-default-500">
                Nuevo: {file.name} · {formatFileSize(file.size)}
              </span>
            ) : (
              <span className="text-xs text-default-400">
                Actual: {document?.fileName ?? '—'}
                {document ? ` · ${document.fileExt.toUpperCase()} · ${formatFileSize(document.fileSize)}` : ''}
                . Deja vacío para conservarlo.
              </span>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            Cancelar
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
