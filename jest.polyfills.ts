/**
 * Polyfills que deben existir **antes** de que se cargue cualquier módulo de prueba.
 *
 * jsdom emula el DOM pero no las APIs que usa `jose`, la librería que cifra la cookie
 * de sesión en `lib/auth/session-crypto.ts`: no expone `crypto.subtle`, ni
 * `TextEncoder`/`TextDecoder`, ni `structuredClone`. Se toman de Node, que implementa
 * los mismos estándares (WebCrypto, Encoding, Structured Clone) que el navegador.
 *
 * Hay un detalle que obliga a hacer algo más que asignarlas: cada realm de JavaScript
 * tiene sus propios constructores. El `TextEncoder` de `node:util` devuelve un
 * `Uint8Array` del realm de Node, mientras que el `Uint8Array` global dentro de jsdom
 * es otro objeto distinto — y `jose` valida sus entradas con `instanceof`, que compara
 * identidad de constructor. Sin alinear ambos realms, cifrar falla con
 * "plaintext must be an instance of Uint8Array". Por eso también se sustituyen los
 * constructores de arrays binarios por los de Node.
 */
import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import { deserialize, serialize } from "node:v8";

// Constructores del realm de Node, obtenidos del propio codificador para no
// depender de cómo Jest exponga los globales de Node dentro del entorno jsdom.
const muestra = new TextEncoder().encode("");
const NodeUint8Array = muestra.constructor as Uint8ArrayConstructor;
const NodeArrayBuffer = muestra.buffer.constructor as ArrayBufferConstructor;

const define = (nombre: string, value: unknown) =>
  Object.defineProperty(globalThis, nombre, { value, writable: true, configurable: true });

define("TextEncoder", TextEncoder);
define("TextDecoder", TextDecoder);
define("Uint8Array", NodeUint8Array);
define("ArrayBuffer", NodeArrayBuffer);

if (!globalThis.crypto?.subtle) {
  define("crypto", webcrypto);
}

globalThis.structuredClone ??= (<T>(value: T): T =>
  deserialize(serialize(value)) as T) as typeof globalThis.structuredClone;
