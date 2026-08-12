/**
 * API pública del módulo de espacios. Ver `modules/bookings/index.ts` para la regla.
 *
 * A diferencia del resto, expone varios componentes: `/espacios` compone la lista en
 * el propio Server Component y solo delega las acciones y los wizards.
 */
export { CrearEspacioWizard } from "./components/CrearEspacioWizard";
export { EditarEspacioWizard } from "./components/EditarEspacioWizard";
export { ActivarEspacioButton } from "./components/ActivarEspacioButton";
export { InactivarEspacioButton } from "./components/InactivarEspacioButton";
