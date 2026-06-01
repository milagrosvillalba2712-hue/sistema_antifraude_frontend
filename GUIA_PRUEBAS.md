# Guía de Pruebas - Frontend Sistema Antifraude

## Estrategia de Pruebas

El frontend utiliza un enfoque de pruebas basado en:

1. **Pruebas Unitarias**: Componentes y utilidades
2. **Pruebas de Integración**: Flujo de usuario y API
3. **Pruebas E2E**: Flujo completo de la aplicación

## Configuración

### Dependencias de Prueba

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Scripts de Prueba

Agregar en `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Pruebas Unitarias

### Componentes

```typescript
// Ejemplo: Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByText('Delete')).toHaveClass('bg-red-600');
  });
});
```

### Utilidades

```typescript
// Ejemplo: format.test.ts
import { formatCurrency, formatNumber } from './format';

describe('formatCurrency', () => {
  it('formats currency correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });
});

describe('formatNumber', () => {
  it('formats number correctly', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});
```

## Pruebas de Integración

### Flujo de Login

```typescript
// Ejemplo: Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Flow', () => {
  it('navigates to dashboard on successful login', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@antifraude.com' },
    });

    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'password' },
    });

    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

## Pruebas de API

### Mock de API

```typescript
// Ejemplo: api.test.ts
import { describe, it, expect, vi } from 'vitest';
import api from './axios';

vi.mock('./axios');

describe('API', () => {
  it('makes login request', async () => {
    const mockResponse = { data: { token: 'test-token' } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const response = await api.post('/auth/login', {
      email: 'test@test.com',
      password: 'password',
    });

    expect(response.data.token).toBe('test-token');
  });
});
```

## Pruebas E2E (Cypress)

### Instalación

```bash
npm install -D cypress
```

### Configuración

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
  },
});
```

### Ejemplo de Prueba E2E

```typescript
// cypress/e2e/login.cy.ts
describe('Login', () => {
  it('logs in successfully', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('admin@antifraude.com');
    cy.get('input[name="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## Ejecución de Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm test -- --watch

# Ejecutar pruebas con cobertura
npm run test:coverage

# Ejecutar pruebas E2E
npx cypress open
```

## Cobertura de Código

### Configuración

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
```

### Generar Reporte

```bash
npm run test:coverage
```

El reporte estará disponible en `coverage/`.

## Casos de Prueba por Módulo

### Login
- [ ] Login exitoso con credenciales válidas
- [ ] Error con credenciales inválidas
- [ ] Persistencia de sesión
- [ ] Redirección a dashboard

### Dashboard
- [ ] Carga de KPIs
- [ ] Renderizado de gráficos
- [ ] Actualización en tiempo real (WebSocket)

### Alertas
- [ ] Listado de alertas
- [ ] Filtros por estado y prioridad
- [ ] Paginación
- [ ] Asignación de alerta
- [ ] Resolución de alerta

### Reglas
- [ ] Crear regla
- [ ] Editar regla
- [ ] Activar/desactivar regla
- [ ] Validación de formularios

### KYC
- [ ] Consulta de identidad
- [ ] Manejo de errores
- [ ] Resultados positivos/negativos

### Reportes
- [ ] Exportación CSV
- [ ] Descarga de archivo

### Usuarios
- [ ] Crear usuario
- [ ] Editar usuario
- [ ] Desactivar usuario
- [ ] Control de acceso por rol

## Buenas Prácticas

1. **Test-Driven Development (TDD)**: Escribir pruebas antes del código
2. **Coverage mínimo**: Mantener cobertura > 80%
3. **Pruebas aisladas**: Cada prueba debe ser independiente
4. **Mock externo**: Mockear API calls y servicios externos
5. **Nombres descriptivos**: Describir claramente qué se está probando

## Solución de Problemas

### Pruebas que fallan aleatoriamente
- Verificar que no hay dependencias entre pruebas
- Usar `beforeEach` para limpiar estado

### Pruebas lentas
- Mockear servicios externos
- Usar `jest.useFakeTimers()` para fechas

### Errores de importación
- Verificar configuración de paths en `tsconfig.json`
- Usar alias de paths para imports complejos
