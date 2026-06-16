import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, CardFooter, CardHeader, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { DocumentListItem } from '@/api/types';
import { useAuth } from '@/context/AuthContext';
import { formatDateShort } from '@/lib/format';
import { CategoryIcon } from './CategoryIcon';

interface DocumentCardProps {
  document: DocumentListItem;
}

export function DocumentCard({ document }: Readonly<DocumentCardProps>) {
  // Public listing returns published docs only, so publishedAt is always set.
  const dateValue = document.publishedAt;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleViewDetail = () => {
    const target = `/documents/${document.id}`;
    if (!isAuthenticated) {
      // Anonymous users must log in first; send them back to the detail page after.
      navigate('/login', { state: { from: target } });
      return;
    }
    navigate(target);
  };

  return (
    <Card
      className="h-full border border-divider bg-content1 transition-all hover:-translate-y-1 hover:shadow-lg"
      radius="lg"
      shadow="sm"
    >
      <CardHeader className="flex flex-wrap gap-1.5 pb-0">
        {document.categories.map((category) => (
          <Chip
            key={category.id}
            size="sm"
            variant="flat"
            color="primary"
            startContent={<CategoryIcon icon={category.icon} size={14} className="ml-1" />}
            classNames={{ content: 'text-xs font-medium text-primary-300' }}
          >
            {category.name}
          </Chip>
        ))}
      </CardHeader>

      <CardBody className="gap-2 pt-3">
        <h3 className="line-clamp-2 text-base font-bold text-foreground">{document.title}</h3>
        {document.description && (
          <p className="line-clamp-2 text-sm text-default-500">{document.description}</p>
        )}
        <p className="text-xs text-default-400">
          Publicado por {document.uploadedByName} • {formatDateShort(dateValue)}
        </p>
      </CardBody>

      <CardFooter className="pt-0">
        <Button
          fullWidth
          color="primary"
          radius="lg"
          onPress={handleViewDetail}
          startContent={
            <Icon icon="mdi:eye-outline" width={18} height={18} aria-hidden />
          }
          aria-label={`Ver detalle de ${document.title}`}
        >
          Ver Más
        </Button>
      </CardFooter>
    </Card>
  );
}
