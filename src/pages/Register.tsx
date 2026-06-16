import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Link as HeroLink } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toUserMessage } from '@/api/client';

/**
 * Dedicated registration page (no modal/overlay dependency). New accounts are
 * created with role 'user'; on success the user is logged in and sent home.
 */
export function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-2">
        <CardHeader className="flex flex-col items-start gap-1 pb-0">
         <Link to="/" className="flex items-center font-bold text-foreground">
           <span className="flex pr-1 items-center justify-center">
              <Icon icon="mdi:flash" width={20} height={20} className="text-primary-400" aria-hidden />
            </span>
            <span className="text-lg tracking-tight">DocsHub</span>
          </Link>
          <h1 className="text-xl font-semibold">Crear cuenta</h1>
          <p className="text-sm text-default-500">Regístrate para subir documentos a revisión.</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              isRequired
              label="Nombre"
              value={name}
              onValueChange={setName}
              autoComplete="name"
              autoFocus
            />
            <Input
              isRequired
              type="email"
              label="Correo electrónico"
              value={email}
              onValueChange={setEmail}
              autoComplete="email"
            />
            <Input
              isRequired
              type="password"
              label="Contraseña"
              value={password}
              onValueChange={setPassword}
              autoComplete="new-password"
              description="Mínimo 8 caracteres."
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="flat"
                type="button"
                onPress={() => navigate('/')}
                startContent={<Icon icon="mdi:arrow-left" width={18} height={18} aria-hidden />}
                className="flex-1 font-medium"
              >
                Volver
              </Button>
              <Button color="primary" type="submit" 
                isLoading={submitting} 
                endContent={<Icon icon="mdi:arrow-right" width={18} height={18} aria-hidden />} 
                className="flex-1 font-medium"
              >
                Registrarme
              </Button>
            </div>
            <p className="text-center text-sm text-default-500">
              ¿Ya tienes cuenta?{' '}
              <HeroLink as={Link} to="/login" size="sm" className="font-bold">
                Inicia sesión
              </HeroLink>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
