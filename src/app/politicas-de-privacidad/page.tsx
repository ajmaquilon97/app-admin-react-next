import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Políticas de privacidad — RecreAdmin",
};

export default function PoliticasPrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10">
        <Link
          href="/signup"
          className="text-sm text-text-muted underline underline-offset-2 hover:text-text-main"
        >
          ← Volver al registro
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold text-text-main">
        Políticas de privacidad
      </h1>
      <p className="mb-10 text-sm text-text-muted">
        Última actualización: junio 2025 · Versión 1.0
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-text-main">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Responsable del tratamiento</h2>
          <p>
            [Nombre o razón social de tu empresa], con domicilio en [dirección],
            es responsable del tratamiento de los datos personales que recopilamos
            a través de la plataforma RecreAdmin.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Datos que recopilamos</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Nombre completo y apellido.</li>
            <li>Correo electrónico.</li>
            <li>Número de cédula y fecha de nacimiento (en el proceso de onboarding).</li>
            <li>Información de uso de la plataforma (actividad, accesos, preferencias).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Finalidad del tratamiento</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Gestionar tu cuenta y acceso a la plataforma.</li>
            <li>Administrar reservas de espacios recreativos.</li>
            <li>Enviarte notificaciones relacionadas con tu cuenta y reservas.</li>
            <li>Cumplir con obligaciones legales y regulatorias.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Base legal</h2>
          <p>
            El tratamiento de tus datos se ampara en tu consentimiento expreso,
            otorgado al momento del registro, de conformidad con la{" "}
            <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong>{" "}
            del Ecuador y sus normas complementarias.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Conservación de datos</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa o el tiempo necesario
            para cumplir con las finalidades descritas. Una vez que solicites la eliminación
            de tu cuenta, procederemos a suprimir tus datos en un plazo máximo de
            30 días hábiles, salvo que la ley exija su conservación por un período mayor.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Tus derechos (ARCO)</h2>
          <p className="mb-3">
            De conformidad con la LOPDP, tienes derecho a:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Acceso:</strong> conocer qué datos tuyos tratamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Cancelación / Supresión:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento en determinadas circunstancias.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
            <li><strong>Revocación del consentimiento:</strong> en cualquier momento, sin efecto retroactivo.</li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos, escríbenos a{" "}
            <a
              href="mailto:privacidad@recreadmin.com"
              className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
            >
              privacidad@recreadmin.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas adecuadas para proteger
            tus datos frente a acceso no autorizado, pérdida o divulgación, incluyendo
            cifrado de sesiones, transmisión por HTTPS y control de acceso por roles.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Inicio de sesión con Google</h2>
          <p>
            Si decides registrarte o iniciar sesión usando tu cuenta de Google, RecreAdmin
            recibe únicamente tu nombre, correo electrónico y foto de perfil, con tu
            consentimiento. No almacenamos tu contraseña de Google ni tenemos acceso
            a otros datos de tu cuenta.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Cambios en esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos por correo
            ante cambios sustanciales. El uso continuado de la plataforma tras la
            notificación implica tu aceptación de la nueva versión.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">10. Contacto</h2>
          <p>
            Para consultas sobre privacidad o protección de datos, escríbenos a{" "}
            <a
              href="mailto:privacidad@recreadmin.com"
              className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
            >
              privacidad@recreadmin.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
