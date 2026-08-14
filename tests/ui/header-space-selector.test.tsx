import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderSpaceSelector } from "@/components/ui/HeaderSpaceSelector";
import { AgoraLogo } from "@/components/ui/AgoraLogo";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

/**
 * `HeaderSpaceSelector` es el **único** punto de la aplicación donde el id de un
 * espacio cruza entre el `number` del dominio y el `string` que impone el DOM
 * (ver AGENTS.md → convenciones). Estas pruebas fijan ese contrato: hacia dentro
 * siempre sale un `number` o `null`, nunca una cadena.
 */

const espacios = [
  espacioOption({ id: 1, nombre: "Cancha Norte", tipoEspacioNombre: "Cancha de fútbol" }),
  espacioOption({ id: 2, nombre: "Piscina", tipoEspacioNombre: null }),
];

describe("HeaderSpaceSelector", () => {
  it("lista cada espacio con su tipo cuando lo tiene", () => {
    renderWithQuery(<HeaderSpaceSelector espacios={espacios} value={null} onChange={jest.fn()} allowAll />);

    expect(screen.getByRole("option", { name: "Cancha Norte · Cancha de fútbol" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Piscina" })).toBeInTheDocument();
  });

  it("devuelve el id como número, no como la cadena del DOM", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <HeaderSpaceSelector espacios={espacios} value={null} onChange={onChange} allowAll />,
    );
    await usuario.selectOptions(screen.getByRole("combobox"), "2");

    expect(onChange).toHaveBeenCalledWith(2);
    expect(typeof onChange.mock.calls[0]![0]).toBe("number");
  });

  it("representa 'todos los espacios' como null", async () => {
    const onChange = jest.fn();
    const usuario = userEvent.setup();

    renderWithQuery(
      <HeaderSpaceSelector espacios={espacios} value={1} onChange={onChange} allowAll />,
    );
    await usuario.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("refleja el valor seleccionado por el padre", () => {
    renderWithQuery(<HeaderSpaceSelector espacios={espacios} value={2} onChange={jest.fn()} allowAll />);

    expect(screen.getByRole("combobox")).toHaveValue("2");
  });

  it("muestra el campo vacío cuando no hay selección", () => {
    renderWithQuery(<HeaderSpaceSelector espacios={espacios} value={null} onChange={jest.fn()} allowAll />);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("permite renombrar la opción de 'todos'", () => {
    renderWithQuery(
      <HeaderSpaceSelector
        espacios={espacios}
        value={null}
        onChange={jest.fn()}
        allowAll
        allLabel="Todo el negocio"
      />,
    );

    expect(screen.getByRole("option", { name: "Todo el negocio" })).toBeInTheDocument();
  });

  it("sin allowAll no ofrece la opción de ver todos", () => {
    renderWithQuery(<HeaderSpaceSelector espacios={espacios} value={1} onChange={jest.fn()} />);

    expect(screen.queryByRole("option", { name: "Todos los espacios" })).not.toBeInTheDocument();
  });

  /** Un anfitrión recién registrado todavía no tiene espacios. */
  it("muestra un marcador deshabilitado cuando no hay espacios y no se permite 'todos'", () => {
    renderWithQuery(<HeaderSpaceSelector espacios={[]} value={null} onChange={jest.fn()} />);

    const marcador = screen.getByRole("option", { name: "Selecciona un espacio…" });
    expect(marcador).toBeDisabled();
  });

  it("permite personalizar ese marcador", () => {
    renderWithQuery(
      <HeaderSpaceSelector
        espacios={[]}
        value={null}
        onChange={jest.fn()}
        placeholder="Aún no tienes espacios"
      />,
    );

    expect(screen.getByRole("option", { name: "Aún no tienes espacios" })).toBeInTheDocument();
  });
});

describe("AgoraLogo", () => {
  it("usa el logo a color por defecto", () => {
    renderWithQuery(<AgoraLogo />);

    expect(screen.getByAltText("Agora")).toBeInTheDocument();
  });

  it("acepta la variante en blanco para fondos oscuros", () => {
    renderWithQuery(<AgoraLogo variant="white" size={48} />);

    const logo = screen.getByAltText("Agora");
    expect(logo).toHaveAttribute("width", "48");
  });
});
