import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '@/api/documents';
import { toUserMessage } from '@/api/client';
import { useCategories } from '@/hooks/useCategories';

/**
 * Authenticated upload form. Minimal but functional this milestone: it performs
 * the real multipart POST and, on success, tells the user the document is
 * pending admin approval. Richer validation/UX lands in a later milestone.
 */
export function Upload() {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError('Selecciona un archivo para subir.');
      return;
    }
    setSubmitting(true);
    try {
      await uploadDocument({
        title,
        description,
        categoryIds: [...categoryIds].map(Number),
        file,
      });
      setSuccess(true);
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          <h1 className="text-xl font-semibold">Documento enviado</h1>
          <p className="text-default-600">
            Tu documento quedó <strong>pendiente de aprobación</strong> por un administrador.
            Aparecerá publicado una vez que sea revisado.
          </p>
          <div className="flex gap-2">
            <Button color="primary" onPress={() => navigate('/my-uploads')}>
              Ver mis documentos
            </Button>
            <Button variant="flat" onPress={() => navigate('/')}>
              Volver al inicio
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <h1 className="text-xl font-semibold">Subir documento</h1>
      </CardHeader>
      <CardBody>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input isRequired label="Título" value={title} onValueChange={setTitle} />
          <Textarea label="Descripción" value={description} onValueChange={setDescription} />
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
            <label htmlFor="file" className="text-sm font-medium">
              Archivo
            </label>
            <input
              id="file"
              type="file"
              accept=".doc,.docx,.pdf,.txt,.html,.jpg,.png"
              onChange={handleFileChange}
              className="text-sm"
            />
            <span className="text-xs text-default-400">
              Permitidos: doc, docx, pdf, txt, html, jpg, png.
            </span>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <Button color="primary" type="submit" isLoading={submitting}>
            Subir documento
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
