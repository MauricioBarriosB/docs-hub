import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react';
import { useAuth } from '@/context/AuthContext';
import { useAuthModal } from '@/context/AuthModalContext';
import { toUserMessage } from '@/api/client';

export function AuthModal() {
  const { isOpen, view, close, setView } = useAuthModal();
  const { login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = view === 'register';

  // Reset transient state whenever the modal opens or the view switches.
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword('');
    }
  }, [isOpen, view]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      close();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} placement="center" backdrop="blur">
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader className="flex flex-col gap-1">
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </ModalHeader>
          <ModalBody>
            {isRegister && (
              <Input
                isRequired
                label="Nombre"
                value={name}
                onValueChange={setName}
                autoComplete="name"
              />
            )}
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
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <p className="text-sm text-default-500">
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <Link
                as="button"
                type="button"
                size="sm"
                onPress={() => setView(isRegister ? 'login' : 'register')}
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </Link>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={close} type="button">
              Cancelar
            </Button>
            <Button color="primary" type="submit" isLoading={submitting}>
              {isRegister ? 'Registrarme' : 'Entrar'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
