import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Card, CardBody, CardHeader, Input, Link as HeroLink } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toUserMessage } from '@/api/client';

interface LocationState {
  from?: string;
}

/**
 * Dedicated login page (no modal/overlay dependency). After a successful login
 * the user is sent to the page they originally tried to reach, or home.
 */
export function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
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
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-default-500">Accede para subir y administrar documentos.</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              isRequired
              type="email"
              label="Correo electrónico"
              value={email}
              onValueChange={setEmail}
              autoComplete="email"
              autoFocus
            />
            <Input
              isRequired
              type="password"
              label="Contraseña"
              value={password}
              onValueChange={setPassword}
              autoComplete="current-password"
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
                Entrar
              </Button>
            </div>
            <p className="text-center text-sm text-default-500">
              ¿No tienes cuenta?{' '}
              <HeroLink as={Link} to="/register" size="sm" className="font-bold">
                Regístrate
              </HeroLink>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
