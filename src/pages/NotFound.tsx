import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-default-500">La página que buscas no existe.</p>
      <Button color="primary" onPress={() => navigate('/')}>
        Volver al inicio
      </Button>
    </div>
  );
}
