import "@testing-library/jest-dom";

/**
 * Entorno base compartido por todas las pruebas.
 *
 * jsdom no implementa varias APIs del navegador que usan los componentes del
 * portal (observers, matchMedia, scrollIntoView). Se rellenan aquí una sola vez
 * en lugar de repetir el mock en cada archivo de prueba.
 */

// `SESSION_SECRET` es obligatorio para `lib/auth/session-crypto.ts`.
// 32 bytes en base64 → clave válida para A256GCM. Valor de prueba, no de producción.
process.env.SESSION_SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080";
process.env.API_URL ??= "http://localhost:8080";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverMock as unknown as typeof ResizeObserver;

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverMock as unknown as typeof IntersectionObserver;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.releasePointerCapture = () => {};

// `sonner` monta un portal con timers; en pruebas basta con verificar la llamada.
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    message: jest.fn(),
  },
  Toaster: () => null,
}));
