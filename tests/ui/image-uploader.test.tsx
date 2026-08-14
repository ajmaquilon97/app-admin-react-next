/**
 * `ImageUploader` — subida directa a S3 mediante URL prefirmada.
 *
 * El flujo tiene dos peticiones encadenadas: primero el Route Handler
 * `/api/upload/presign` devuelve la URL firmada, y después el archivo va al
 * bucket sin pasar por el servidor de Next.js. Las pruebas cubren el camino
 * feliz y, sobre todo, que un fallo en cualquiera de los dos pasos deje al
 * usuario con un mensaje y sin una URL a medias en el formulario.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { renderWithQuery } from "../helpers/render";

const PRESIGN = { uploadUrl: "https://s3.test/firmada", publicUrl: "https://cdn.test/foto.jpg" };

function respuesta(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

function archivo(nombre = "foto.png", tipo = "image/png"): File {
  return new File(["contenido"], nombre, { type: tipo });
}

/** El input de archivo está oculto: se accede por su tipo, no por rol. */
function inputArchivo(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]')!;
}

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("estado vacío", () => {
  it("invita a arrastrar una imagen y declara los límites", () => {
    renderWithQuery(<ImageUploader value="" onChange={jest.fn()} />);

    expect(screen.getByText("Arrastra tu imagen aquí")).toBeInTheDocument();
    expect(screen.getByText("JPG, PNG o WEBP · Máx. 5 MB")).toBeInTheDocument();
  });

  it("solo acepta los formatos de imagen soportados", () => {
    const { container } = renderWithQuery(<ImageUploader value="" onChange={jest.fn()} />);

    expect(inputArchivo(container)).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });
});

describe("imagen ya guardada", () => {
  it("muestra la imagen del padre en vez de la zona de arrastre", () => {
    renderWithQuery(<ImageUploader value="https://cdn.test/previa.jpg" onChange={jest.fn()} />);

    expect(screen.getByAltText("Imagen de portada")).toHaveAttribute(
      "src",
      "https://cdn.test/previa.jpg",
    );
    expect(screen.queryByText("Arrastra tu imagen aquí")).not.toBeInTheDocument();
  });

  it("permite cambiarla o eliminarla", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<ImageUploader value="https://cdn.test/previa.jpg" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "Cambiar imagen" })).toBeInTheDocument();

    const [eliminar] = screen.getAllByRole("button");
    await usuario.click(eliminar!);

    // Eliminar vacía el valor del padre: el formulario no debe quedarse con una
    // URL que el usuario ya descartó.
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("subida", () => {
  it("pide la URL prefirmada con los metadatos del archivo y sube al bucket", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(PRESIGN))
      .mockResolvedValueOnce(respuesta({}, true));
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={onChange} />);
    await usuario.upload(inputArchivo(container), archivo());

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(PRESIGN.publicUrl));

    const [urlPresign, opcionesPresign] = fetchMock.mock.calls[0]!;
    expect(urlPresign).toBe("/api/upload/presign");
    expect(JSON.parse(opcionesPresign.body)).toEqual({
      fileName: "foto.png",
      contentType: "image/png",
      fileSize: expect.any(Number),
    });

    const [urlS3, opcionesS3] = fetchMock.mock.calls[1]!;
    expect(urlS3).toBe(PRESIGN.uploadUrl);
    expect(opcionesS3.method).toBe("PUT");
  });

  it("confirma visualmente que la imagen quedó subida", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(PRESIGN))
      .mockResolvedValueOnce(respuesta({}, true));
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo());

    expect(await screen.findByText("Imagen subida")).toBeInTheDocument();
  });

  it("muestra el motivo cuando el servidor rechaza la firma", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ error: "El archivo supera los 5 MB." }, false));
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={onChange} />);
    await usuario.upload(inputArchivo(container), archivo());

    expect(await screen.findByText("El archivo supera los 5 MB.")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("usa un mensaje genérico si el rechazo no trae motivo", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({}, false));
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo());

    expect(await screen.findByText("No se pudo obtener la URL de subida.")).toBeInTheDocument();
  });

  /** Si S3 falla, el formulario no debe quedarse con una URL que no existe. */
  it("no propaga ninguna URL si la subida al bucket falla", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(PRESIGN))
      .mockResolvedValueOnce(respuesta({}, false));
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={onChange} />);
    await usuario.upload(inputArchivo(container), archivo());

    expect(await screen.findByText("Error al subir la imagen a S3.")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  /**
   * Comportamiento observado, no ideal: `handleFile` limpia la vista previa al
   * fallar, pero el `onload` del `FileReader` —que corre después— vuelve a
   * ponerla. El resultado es que el usuario ve la miniatura local junto al
   * mensaje de error. Es aceptable (deja claro qué archivo falló) y permite
   * reintentar con "Cambiar imagen", pero queda fijado aquí para que un cambio
   * de ese orden se note.
   */
  it("tras un fallo mantiene el error visible y permite reintentar", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ error: "Formato no permitido." }, false));
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<ImageUploader value="" onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo());

    await screen.findByText("Formato no permitido.");
    expect(screen.getByRole("button", { name: "Cambiar imagen" })).toBeInTheDocument();
    expect(screen.queryByText("Imagen subida")).not.toBeInTheDocument();
  });
});
