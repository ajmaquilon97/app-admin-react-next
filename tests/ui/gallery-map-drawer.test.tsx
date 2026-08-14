/**
 * Componentes transversales que quedan: galería de imágenes, selector de mapa,
 * drawer de detalle de un horario y los botones de activar/inactivar espacio.
 *
 * La galería es la que más reglas de negocio esconde: un tope de 7 imágenes,
 * 5 MB por archivo y solo tres formatos. Todo eso se valida antes de gastar una
 * URL prefirmada, así que se prueba con archivos que incumplen cada regla.
 */

jest.mock("@/modules/spaces/actions/spaces", () => ({
  activarEspacio: jest.fn(),
  inactivarEspacio: jest.fn(),
}));

/**
 * Leaflet necesita medir el contenedor, y jsdom no calcula layout: sin doble,
 * `L.map()` lanza "Map container not found". Además se importa de forma
 * dinámica, así que la promesa resuelve *después* de que la prueba termina y el
 * error aparecería en otra. El doble mantiene el componente ejercitable y deja
 * observar el registro del manejador de clic, que es su lógica propia.
 */
const mapaDoble = {
  setView: jest.fn().mockReturnThis(),
  on: jest.fn(),
  remove: jest.fn(),
};
const marcadorDoble = { addTo: jest.fn().mockReturnThis(), setLatLng: jest.fn() };

jest.mock("leaflet", () => ({
  __esModule: true,
  map: jest.fn(() => mapaDoble),
  marker: jest.fn(() => marcadorDoble),
  tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
  Icon: { Default: { prototype: {}, mergeOptions: jest.fn() } },
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as spacesActions from "@/modules/spaces/actions/spaces";
import { GalleryUploader } from "@/components/ui/GalleryUploader";
import { MapPicker } from "@/components/ui/MapPicker";
import { AvailabilityBlockDrawer } from "@/modules/availability/components/AvailabilityBlockDrawer";
import { ActivarEspacioButton, InactivarEspacioButton } from "@/modules/spaces";
import type { Block } from "@/modules/availability";
import { renderWithQuery } from "../helpers/render";

const acciones = jest.mocked(spacesActions);

const PRESIGN = { uploadUrl: "https://s3.test/firmada", publicUrl: "https://cdn.test/foto.jpg" };

function respuesta(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

/** `File` no permite fijar `size` directamente: se redefine la propiedad. */
function archivo(nombre: string, tipo: string, bytes = 1024): File {
  const f = new File(["x"], nombre, { type: tipo });
  Object.defineProperty(f, "size", { value: bytes });
  return f;
}

function inputArchivo(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]')!;
}

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue(respuesta(PRESIGN));
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("GalleryUploader", () => {
  it("declara los límites en el estado vacío", () => {
    renderWithQuery(<GalleryUploader value={[]} onChange={jest.fn()} />);

    expect(screen.getByText("Arrastra las imágenes aquí")).toBeInTheDocument();
    expect(
      screen.getByText("JPG, PNG o WEBP · Máx. 5 MB por imagen · Hasta 7 imágenes"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 / 7 imágenes subidas")).toBeInTheDocument();
  });

  it("acepta selección múltiple de los formatos soportados", () => {
    const { container } = renderWithQuery(<GalleryUploader value={[]} onChange={jest.fn()} />);
    const input = inputArchivo(container);

    expect(input).toHaveAttribute("multiple");
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("parte de las URLs que ya tiene el formulario", () => {
    renderWithQuery(
      <GalleryUploader
        value={["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByAltText("Imagen 1")).toHaveAttribute("src", "https://cdn.test/1.jpg");
    expect(screen.getByAltText("Imagen 2")).toBeInTheDocument();
    expect(screen.getByText("2 / 7 imágenes subidas")).toBeInTheDocument();
  });

  it("sube la imagen elegida y propaga su URL pública", async () => {
    fetchMock
      .mockResolvedValueOnce(respuesta(PRESIGN))
      .mockResolvedValueOnce(respuesta({}, true));
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<GalleryUploader value={[]} onChange={onChange} />);
    await usuario.upload(inputArchivo(container), archivo("foto.png", "image/png"));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([PRESIGN.publicUrl]));
  });

  it("marca la imagen que falló sin descartar el resto", async () => {
    fetchMock.mockResolvedValueOnce(respuesta({ error: "Cuota agotada." }, false));
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<GalleryUploader value={[]} onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo("foto.png", "image/png"));

    expect(await screen.findByText("Cuota agotada.")).toBeInTheDocument();
    expect(screen.getByText("0 / 7 imágenes subidas")).toBeInTheDocument();
  });

  /** Un formato no soportado se descarta en el cliente, sin gastar una URL firmada. */
  it("ignora un archivo de formato no permitido", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<GalleryUploader value={[]} onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo("doc.pdf", "application/pdf"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Arrastra las imágenes aquí")).toBeInTheDocument();
  });

  it("ignora un archivo que supera los 5 MB", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<GalleryUploader value={[]} onChange={jest.fn()} />);
    await usuario.upload(
      inputArchivo(container),
      archivo("grande.png", "image/png", 6 * 1024 * 1024),
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("oculta el botón de agregar al llegar al tope de 7 imágenes", () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://cdn.test/${i}.jpg`);

    renderWithQuery(<GalleryUploader value={urls} onChange={jest.fn()} />);

    expect(screen.queryByText("Agregar")).not.toBeInTheDocument();
    expect(screen.getByText("7 / 7 imágenes subidas")).toBeInTheDocument();
  });

  it("no sube nada más cuando ya se alcanzó el tope", async () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://cdn.test/${i}.jpg`);
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<GalleryUploader value={urls} onChange={jest.fn()} />);
    await usuario.upload(inputArchivo(container), archivo("extra.png", "image/png"));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("elimina una imagen y lo refleja en el formulario", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <GalleryUploader
        value={["https://cdn.test/1.jpg", "https://cdn.test/2.jpg"]}
        onChange={onChange}
      />,
    );
    const [eliminar] = screen.getAllByRole("button");
    await usuario.click(eliminar!);

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(["https://cdn.test/2.jpg"]));
  });

  it("ofrece agregar más mientras quede espacio", () => {
    renderWithQuery(<GalleryUploader value={["https://cdn.test/1.jpg"]} onChange={jest.fn()} />);

    expect(screen.getByText("Agregar")).toBeInTheDocument();
  });
});

describe("MapPicker", () => {
  it("monta el contenedor del mapa y su hoja de estilos", () => {
    const { container } = renderWithQuery(<MapPicker value={null} onChange={jest.fn()} />);

    expect(container.querySelector("link[rel='stylesheet']")).toHaveAttribute(
      "href",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    );
    expect(container.querySelector("div.h-64")).toBeInTheDocument();
  });

  it("centra el mapa en Ecuador cuando aún no hay coordenadas", async () => {
    renderWithQuery(<MapPicker value={null} onChange={jest.fn()} />);

    await waitFor(() => expect(mapaDoble.setView).toHaveBeenCalled());
    expect(mapaDoble.setView).toHaveBeenCalledWith([-1.8312, -78.1834], 7);
  });

  it("coloca el marcador y acerca el mapa si ya hay coordenadas guardadas", async () => {
    const L = await import("leaflet");
    renderWithQuery(<MapPicker value={{ lat: -2.17, lng: -79.92 }} onChange={jest.fn()} />);

    await waitFor(() => expect(L.marker).toHaveBeenCalledWith([-2.17, -79.92]));
    expect(mapaDoble.setView).toHaveBeenCalledWith([-2.17, -79.92], 15);
  });

  /** El clic sobre el mapa es la única forma de fijar la ubicación del espacio. */
  it("propaga las coordenadas del clic sobre el mapa", async () => {
    const onChange = jest.fn();
    renderWithQuery(<MapPicker value={null} onChange={onChange} />);

    await waitFor(() => expect(mapaDoble.on).toHaveBeenCalledWith("click", expect.any(Function)));
    const alHacerClic = mapaDoble.on.mock.calls.find(([evento]) => evento === "click")![1] as (
      e: { latlng: { lat: number; lng: number } },
    ) => void;
    alHacerClic({ latlng: { lat: -2.19, lng: -79.88 } });

    expect(onChange).toHaveBeenCalledWith({ lat: -2.19, lng: -79.88 });
  });

  it("libera el mapa al desmontar", async () => {
    const { unmount } = renderWithQuery(<MapPicker value={null} onChange={jest.fn()} />);
    await waitFor(() => expect(mapaDoble.setView).toHaveBeenCalled());

    unmount();

    expect(mapaDoble.remove).toHaveBeenCalled();
  });
});

describe("AvailabilityBlockDrawer", () => {
  const bloque = (o: Partial<Block> = {}): Block => ({
    id: "b1",
    espacioId: 1,
    espacioNombre: "Cancha Norte",
    date: "2026-03-10",
    hour: 14,
    status: "available",
    ...o,
  });

  const props = {
    block: bloque(),
    isActing: false,
    onClose: jest.fn(),
    onBlock: jest.fn(),
    onRelease: jest.fn(),
  };

  it("muestra fecha en español y el rango de la franja", () => {
    renderWithQuery(<AvailabilityBlockDrawer {...props} />);

    expect(screen.getByText("Mar, 10 Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("14:00 – 15:00")).toBeInTheDocument();
    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
  });

  it("ofrece bloquear una franja disponible", async () => {
    const onBlock = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(<AvailabilityBlockDrawer {...props} onBlock={onBlock} />);
    await usuario.click(screen.getByRole("button", { name: /Bloquear horario/ }));

    expect(onBlock).toHaveBeenCalledWith(expect.objectContaining({ id: "b1" }));
  });

  it.each(["blocked", "maintenance"] as const)(
    "ofrece liberar una franja %s",
    async (status) => {
      const onRelease = jest.fn();
      const usuario = userEvent.setup();

      renderWithQuery(
        <AvailabilityBlockDrawer {...props} block={bloque({ status })} onRelease={onRelease} />,
      );
      await usuario.click(screen.getByRole("button", { name: /Liberar horario/ }));

      expect(onRelease).toHaveBeenCalledWith(expect.objectContaining({ status }));
    },
  );

  /**
   * Una reserva confirmada no se toca desde la agenda: cancelarla implica
   * reverso y notificación al cliente, que viven en el módulo de Reservas.
   */
  it("una reserva es de solo lectura y remite al módulo de Reservas", () => {
    renderWithQuery(
      <AvailabilityBlockDrawer
        {...props}
        block={bloque({ status: "reserved", clientName: "María Pérez" })}
      />,
    );

    expect(screen.getByText(/solo pueden editarse o cancelarse desde el módulo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Bloquear horario/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Liberar horario/ })).not.toBeInTheDocument();
  });

  it("muestra los datos del cliente de una reserva", () => {
    renderWithQuery(
      <AvailabilityBlockDrawer
        {...props}
        block={bloque({ status: "reserved", clientName: "María Pérez" })}
      />,
    );

    expect(screen.getByText("Información de Reserva")).toBeInTheDocument();
    expect(screen.getByText("María Pérez")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument(); // inicial del avatar
  });

  it("muestra las observaciones del bloqueo", () => {
    renderWithQuery(
      <AvailabilityBlockDrawer
        {...props}
        block={bloque({ status: "blocked", notes: "Cambio de césped" })}
      />,
    );

    expect(screen.getByText("Observaciones")).toBeInTheDocument();
    expect(screen.getByText("Cambio de césped")).toBeInTheDocument();
  });

  it("deshabilita la acción mientras está en curso", () => {
    renderWithQuery(<AvailabilityBlockDrawer {...props} isActing />);

    expect(screen.getByRole("button", { name: /Bloqueando\.\.\./ })).toBeDisabled();
  });

  it("una franja cerrada no ofrece ninguna acción", () => {
    renderWithQuery(<AvailabilityBlockDrawer {...props} block={bloque({ status: "closed" })} />);

    expect(screen.queryByRole("button", { name: /Bloquear horario/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });
});

describe("ActivarEspacioButton", () => {
  it("activa el espacio", async () => {
    acciones.activarEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<ActivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Activar" }));

    await waitFor(() => expect(acciones.activarEspacio).toHaveBeenCalledWith(7));
  });

  /** El motivo del rechazo (p. ej. tarifas incompletas) tiene que ser visible. */
  it("muestra el motivo cuando el backend rechaza la activación", async () => {
    acciones.activarEspacio.mockResolvedValue({
      error: "Completa las tarifas antes de activar el espacio.",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<ActivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Activar" }));

    expect(
      await screen.findByText("Completa las tarifas antes de activar el espacio."),
    ).toBeInTheDocument();
  });
});

describe("InactivarEspacioButton", () => {
  it("pide confirmación antes de inactivar", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<InactivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(screen.getByText("Inactivar espacio")).toBeInTheDocument();
    expect(acciones.inactivarEspacio).not.toHaveBeenCalled();
  });

  /** El anfitrión debe saber que las reservas ya hechas no se cancelan. */
  it("explica el alcance: sin reservas nuevas, las existentes se mantienen", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<InactivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));

    expect(screen.getByText("dejará de recibir reservas nuevas")).toBeInTheDocument();
    expect(screen.getByText("se mantendrán activas")).toBeInTheDocument();
  });

  it("inactiva y cierra el diálogo al confirmar", async () => {
    acciones.inactivarEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<InactivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, inactivar" }));

    await waitFor(() => expect(acciones.inactivarEspacio).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByText("Inactivar espacio")).not.toBeInTheDocument());
  });

  it("mantiene el diálogo abierto y muestra el motivo si el backend lo impide", async () => {
    acciones.inactivarEspacio.mockResolvedValue({
      error: "El espacio tiene reservas confirmadas.",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<InactivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));
    await usuario.click(screen.getByRole("button", { name: "Sí, inactivar" }));

    expect(await screen.findByText("El espacio tiene reservas confirmadas.")).toBeInTheDocument();
    expect(screen.getByText("Inactivar espacio")).toBeInTheDocument();
  });

  it("cierra sin inactivar al pulsar Volver", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<InactivarEspacioButton espacioId={7} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));
    await usuario.click(screen.getByRole("button", { name: "Volver" }));

    expect(screen.queryByText("Inactivar espacio")).not.toBeInTheDocument();
    expect(acciones.inactivarEspacio).not.toHaveBeenCalled();
  });
});
