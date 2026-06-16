import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@heroui/react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { MenuIcon, UploadIcon } from './icons';

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** Opens the mobile sidebar drawer. */
  onOpenSidebar: () => void;
}

export function Header({ search, onSearchChange, onOpenSidebar }: Readonly<HeaderProps>) {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  // Search is already live via the debounced value; the button/submit simply
  // re-applies the current term so pressing Enter or "Buscar" feels responsive.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchChange(search);
  }

  return (
    <Navbar maxWidth="full" isBordered className="border-divider bg-background/80 backdrop-blur">
      <NavbarContent justify="start" className="gap-2">
        <Button
          isIconOnly
          variant="light"
          className="md:hidden"
          aria-label="Abrir menú de categorías"
          onPress={onOpenSidebar}
        >
          <MenuIcon />
        </Button>
        <NavbarBrand className="grow-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center font-bold text-foreground"
          >
            <span className="flex pr-1 items-center justify-center">
              <Icon icon="mdi:flash" width={20} height={20} className="text-primary-400" aria-hidden />
            </span>
            <span className="text-lg tracking-tight">DocsHub</span>
          </button>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center" className="hidden w-full max-w-2xl px-2 sm:flex">
        <NavbarItem className="w-full">
          <form onSubmit={handleSubmit} className="w-full">
            <Input
              aria-label="Buscar documentos"
              placeholder="Buscar documentos..."
              value={search}
              onValueChange={onSearchChange}
              radius="lg"
              variant="flat"
              startContent={
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  height={20}
                  className="text-default-400"
                  aria-hidden
                />
              }
              classNames={{
                inputWrapper:
                  'border-0 pr-1 bg-default-100 hover:bg-default-300 group-data-[focus=true]:bg-default-200',
                input: 'text-sm',
              }}
              endContent={
                <Button
                  type="submit"
                  size="sm"
                  color="primary"
                  radius="lg"
                  className="px-5 font-medium"
                >
                  Buscar
                </Button>
              }
            />
          </form>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3">
        {isAuthenticated ? (
          <>
            <NavbarItem className="hidden sm:flex">
              <Button
                color="primary"
                variant="flat"
                radius="lg"
                className="text-primary-400"
                startContent={<UploadIcon size={18} />}
                onPress={() => navigate('/upload')}
              >
                Subir documento
              </Button>
            </NavbarItem>
            <NavbarItem>
              <ThemeToggle />
            </NavbarItem>
            <NavbarItem>
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    as="button"
                    size="sm"
                    name={user?.name ?? user?.email ?? '?'}
                    aria-label="Menú de usuario"
                    className="cursor-pointer"
                  />
                </DropdownTrigger>
                <DropdownMenu aria-label="Acciones de usuario">
                  <DropdownItem key="profile" textValue="Cuenta" isReadOnly className="opacity-100">
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-default-500">{user?.email}</p>
                  </DropdownItem>
                  <DropdownItem key="uploads" onPress={() => navigate('/my-uploads')}>
                    Mis documentos
                  </DropdownItem>
                  {isAdmin ? (
                    <DropdownItem key="admin" onPress={() => navigate('/admin')}>
                      Panel de administración
                    </DropdownItem>
                  ) : null}
                  <DropdownItem key="logout" color="danger" onPress={logout}>
                    Cerrar sesión
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem className="hidden sm:flex">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-semibold uppercase tracking-widest text-default-500 transition-colors hover:text-foreground cursor-pointer"
              >
                Ingresar
              </button>
            </NavbarItem>
            <NavbarItem className="hidden sm:flex">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-xs font-semibold uppercase tracking-widest text-primary-300 transition-colors hover:text-primary-600 cursor-pointer"
              >
                Registro
              </button>
            </NavbarItem>
            <NavbarItem>
              <ThemeToggle />
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </Navbar>
  );
}
