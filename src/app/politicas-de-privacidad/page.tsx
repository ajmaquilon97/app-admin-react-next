import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de protección de datos — AGORA",
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
        Política de protección de datos personales
      </h1>
      <p className="mb-10 text-sm text-text-muted">
        Última actualización: 29 de julio de 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-text-main">
        <section>
          <h2 className="mb-3 text-lg font-semibold">1. Antecedentes preliminares</h2>
          <p className="mb-3">
            Esta Política de protección de datos personales (en adelante, la
            &quot;Política&quot;) describe cómo OBSIDIANTECHLAB S.A.S., con domicilio
            principal en la ciudad de Guayaquil, República del Ecuador,
            operando la plataforma de marketplace de espacios AGORA (en
            adelante, &quot;AGORA&quot;) recopila, usa, almacena y comparte los datos
            personales de los Clientes (anfitriones) que se registran en el
            Portal del Anfitrión, sitio web y aplicación móvil (en conjunto,
            la &quot;Plataforma&quot;) para publicar y administrar sus Espacios.
          </p>
          <p className="mb-3">
            Al aceptar esta Política, usted autoriza expresamente a AGORA a
            recopilar, procesar, usar y tratar sus datos personales de
            conformidad con la Ley Orgánica de Protección de Datos
            Personales del Ecuador (en adelante, la &quot;LOPDP&quot;), su
            Reglamento General y demás normativa aplicable, así como
            cualquier norma que la modifique o reemplace en el futuro.
          </p>
          <p>
            Usted garantiza la veracidad, exactitud, vigencia y autenticidad
            de los datos personales que nos facilite, y se compromete a
            mantenerlos debidamente actualizados.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">2. Principios que orientan esta Política</h2>
          <p className="mb-3">
            En el tratamiento de sus datos personales, AGORA aplica y
            garantiza los siguientes principios reconocidos por la LOPDP:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Juridicidad:</strong> el tratamiento se sujeta en todo
              momento a la normativa vigente y a las condiciones
              contractuales pactadas con usted.
            </li>
            <li>
              <strong>Licitud, lealtad y transparencia:</strong> tratamos sus
              datos únicamente con base en su consentimiento libre, previo,
              informado, específico e inequívoco, u otra base legal aplicable,
              y le informamos de forma clara y accesible sobre dicho
              tratamiento.
            </li>
            <li>
              <strong>Finalidad:</strong> sus datos se tratan para las
              finalidades determinadas, explícitas y legítimas descritas en
              esta Política.
            </li>
            <li>
              <strong>Calidad y exactitud:</strong> procuramos que sus datos
              sean exactos, completos y estén actualizados; usted puede
              solicitar la corrección de datos inexactos en cualquier
              momento.
            </li>
            <li>
              <strong>Minimización y proporcionalidad:</strong> solo
              solicitamos los datos estrictamente necesarios para las
              finalidades descritas.
            </li>
            <li>
              <strong>Confidencialidad y seguridad:</strong> sus datos se
              tratan bajo debido sigilo y se protegen con medidas técnicas,
              organizativas y administrativas razonables.
            </li>
            <li>
              <strong>Conservación limitada:</strong> conservamos sus datos
              solo durante el tiempo necesario para cumplir con la finalidad
              del tratamiento.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">3. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de sus datos personales es
            OBSIDIANTECHLAB S.A.S. (AGORA), con domicilio principal en la
            ciudad de Guayaquil, Ecuador. Puede contactarnos a través de los
            medios indicados en la sección 12 (Contacto) de esta Política.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">4. Datos personales que recopilamos</h2>
          <p className="mb-3">
            Recopilamos sus datos personales directamente de usted, a través
            de los formularios de registro y configuración de su cuenta en
            la Plataforma:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Datos de registro:</strong> nombres, apellidos, correo
              electrónico y contraseña (almacenada de forma cifrada).
            </li>
            <li>
              <strong>Datos de contacto y verificación:</strong> número de
              celular, utilizado para verificación mediante código enviado
              por SMS y para notificaciones de emergencia y confirmación de
              reservas.
            </li>
            <li>
              <strong>Datos de identificación:</strong> número de cédula o
              RUC y fecha de nacimiento, solicitados durante la
              configuración de su perfil de anfitrión para comprobar su
              identidad y habilitar futuras transferencias correspondientes
              a sus liquidaciones.
            </li>
            <li>
              <strong>Datos de ubicación del perfil:</strong> provincia y
              ciudad de residencia declaradas por usted.
            </li>
            <li>
              <strong>Datos de inicio de sesión con Google:</strong> si
              decide registrarse o iniciar sesión con su cuenta de Google,
              recibimos únicamente su nombre, correo electrónico y foto de
              perfil, con su consentimiento. No almacenamos su contraseña de
              Google ni accedemos a otros datos de su cuenta.
            </li>
            <li>
              <strong>Datos de la sesión:</strong> una cookie técnica,
              cifrada y de uso exclusivamente funcional, que mantiene su
              sesión iniciada en la Plataforma. No utilizamos cookies de
              analítica, publicidad ni de rastreo de terceros.
            </li>
            <li>
              <strong>Datos financieros y tributarios (etapas futuras):</strong>{" "}
              a medida que habilitemos el módulo de liquidaciones y pagos
              descrito en nuestros{" "}
              <Link
                href="/terminos-y-condiciones"
                className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
              >
                Términos y condiciones
              </Link>
              , podremos solicitarle datos bancarios y de facturación
              electrónica adicionales, lo cual será informado oportunamente
              y sujeto a su consentimiento o a las bases legales aplicables.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">5. Finalidades del tratamiento</h2>
          <p className="mb-3">Usamos sus datos personales para:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Crear, verificar y administrar su cuenta de anfitrión.</li>
            <li>
              Habilitarlo para publicar y gestionar sus Espacios en el
              Portal del Anfitrión.
            </li>
            <li>
              Comunicarnos con usted sobre reservas, notificaciones de la
              cuenta y solicitudes de soporte.
            </li>
            <li>
              Comprobar su identidad y prevenir fraude, conforme a lo
              descrito en nuestros Términos y condiciones.
            </li>
            <li>
              Procesar liquidaciones y, cuando corresponda, transferencias
              a su favor.
            </li>
            <li>
              Cumplir con obligaciones legales y tributarias frente a
              autoridades competentes, incluyendo el Servicio de Rentas
              Internas (SRI).
            </li>
            <li>
              Mantener la seguridad, integridad y correcto funcionamiento de
              la Plataforma.
            </li>
            <li>Mejorar nuestros servicios y la experiencia de uso.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">6. Base legal del tratamiento</h2>
          <p>
            Tratamos sus datos personales con base en: (i) su consentimiento
            expreso, otorgado al aceptar esta Política; (ii) la ejecución y
            gestión de la relación contractual descrita en nuestros
            Términos y condiciones; y (iii) el cumplimiento de obligaciones
            legales, tributarias y regulatorias aplicables en Ecuador.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">7. Con quién compartimos sus datos</h2>
          <p className="mb-3">
            No vendemos sus datos personales. Podemos compartir la
            información estrictamente necesaria con:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Proveedores tecnológicos que nos prestan servicios de
              alojamiento (hosting), verificación telefónica (SMS OTP) y
              mantenimiento de la Plataforma, quienes actúan bajo acuerdos
              de confidencialidad y protección de datos.
            </li>
            <li>
              La Pasarela de Pago y proveedores financieros que procesan
              transacciones y liquidaciones, cuando dicho servicio se
              encuentre habilitado para su cuenta.
            </li>
            <li>
              El Servicio de Rentas Internas (SRI) y otras autoridades
              competentes, cuando sea requerido por ley, orden judicial o
              resolución administrativa.
            </li>
            <li>
              Asesores legales, financieros o profesionales que actúen en
              nombre de AGORA, bajo obligaciones de confidencialidad.
            </li>
          </ul>
          <p className="mt-3">
            En caso de fusión, adquisición, reorganización societaria o
            venta de activos de AGORA, sus datos podrán transferirse a la
            parte correspondiente, garantizando siempre el cumplimiento de
            los principios de esta Política.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">8. Transferencias internacionales</h2>
          <p>
            Algunos de nuestros proveedores de infraestructura tecnológica
            (por ejemplo, alojamiento en la nube) pueden procesar datos
            fuera del territorio ecuatoriano. En tales casos, AGORA exige
            contractualmente a dichos proveedores estándares de seguridad y
            confidencialidad adecuados, conforme a lo previsto por la LOPDP
            para las transferencias internacionales de datos personales.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">9. Conservación de datos</h2>
          <p>
            Conservamos sus datos personales mientras su cuenta se
            encuentre activa en la Plataforma o durante el tiempo necesario
            para cumplir con las finalidades descritas en esta Política.
            Una vez que solicite la eliminación de su cuenta, suprimiremos
            sus datos personales en un plazo máximo de treinta (30) días
            hábiles, salvo que la normativa aplicable exija su conservación
            por un período mayor (por ejemplo, para fines contables,
            tributarios o de prevención de fraude).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">10. Sus derechos</h2>
          <p className="mb-3">
            De conformidad con la LOPDP, usted tiene derecho a:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Acceso:</strong> conocer qué datos personales suyos
              tratamos.
            </li>
            <li>
              <strong>Rectificación y actualización:</strong> corregir
              datos inexactos, incompletos o desactualizados.
            </li>
            <li>
              <strong>Eliminación / cancelación:</strong> solicitar la
              supresión de sus datos cuando ya no exista una base legal
              para tratarlos.
            </li>
            <li>
              <strong>Oposición:</strong> oponerse al tratamiento de sus
              datos en las circunstancias previstas por la ley.
            </li>
            <li>
              <strong>Limitación del tratamiento:</strong> solicitar la
              suspensión temporal del tratamiento en los supuestos
              establecidos por la LOPDP.
            </li>
            <li>
              <strong>Portabilidad:</strong> recibir sus datos en un
              formato estructurado, de uso común y lectura mecánica, o
              solicitar su transmisión a otro responsable.
            </li>
            <li>
              <strong>Revocación del consentimiento:</strong> en cualquier
              momento y sin efecto retroactivo.
            </li>
            <li>
              <strong>No ser objeto de decisiones automatizadas</strong>{" "}
              que produzcan efectos jurídicos sobre usted o afecten
              significativamente sus derechos, sin intervención humana.
            </li>
          </ul>
          <p className="mt-3">
            Para ejercer estos derechos, escríbanos a{" "}
            <a
              href="mailto:privacidad@obsidiantechlab.com"
              className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
            >
              privacidad@obsidiantechlab.com
            </a>
            . Verificaremos la legitimidad de su solicitud y le
            responderemos en un plazo máximo de quince (15) días. Si no
            está conforme con nuestra respuesta, puede presentar un reclamo
            ante la Autoridad de Protección de Datos Personales del
            Ecuador.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">11. Cookies y tecnologías similares</h2>
          <p>
            La Plataforma utiliza únicamente una cookie técnica, cifrada y
            de sesión, necesaria para mantener su inicio de sesión y
            proteger su cuenta. Esta cookie no se usa con fines
            publicitarios, de analítica ni de rastreo, y no compartimos su
            contenido con terceros ajenos a la operación de la Plataforma.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">12. Seguridad de la información</h2>
          <p>
            Implementamos medidas técnicas y organizativas razonables para
            proteger sus datos personales frente a acceso no autorizado,
            pérdida, alteración o divulgación indebida, incluyendo cifrado
            de contraseñas y de la sesión, transmisión mediante HTTPS y
            control de acceso por roles. Sin perjuicio de ello, ninguna
            medida de seguridad puede garantizar una protección absoluta;
            le recomendamos mantener la confidencialidad de sus credenciales
            de acceso.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">13. Menores de edad</h2>
          <p>
            La Plataforma está dirigida exclusivamente a personas mayores
            de edad que actúan como anfitriones de Espacios. No recopilamos
            intencionalmente datos personales de niños, niñas o
            adolescentes. Si detectamos que hemos recabado datos de un
            menor de edad sin la autorización correspondiente de sus
            padres o representantes legales, procederemos a eliminarlos a
            la mayor brevedad posible.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">14. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta Política ocasionalmente para reflejar
            cambios en nuestras prácticas o en la normativa aplicable. Le
            notificaremos por correo electrónico ante cambios sustanciales
            y, cuando corresponda, solicitaremos su aceptación expresa. El
            uso continuado de la Plataforma tras dicha notificación implica
            su aceptación de la nueva versión.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">15. Jurisdicción y ley aplicable</h2>
          <p>
            Esta Política se rige por la Ley Orgánica de Protección de
            Datos Personales del Ecuador, su Reglamento y demás normativa
            relacionada. Cualquier controversia derivada de esta Política
            será sometida a los tribunales ordinarios de justicia con
            jurisdicción en Ecuador, sin perjuicio de lo estipulado en
            materia de arbitraje en nuestros{" "}
            <Link
              href="/terminos-y-condiciones"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Términos y condiciones
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">16. Contacto</h2>
          <p>
            Para consultas sobre esta Política o sobre el tratamiento de
            sus datos personales, contáctenos a través de:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Correo electrónico:{" "}
              <a
                href="mailto:privacidad@obsidiantechlab.com"
                className="font-medium text-secondary underline underline-offset-2 hover:text-primary"
              >
                privacidad@obsidiantechlab.com
              </a>
            </li>
            <li>
              Domicilio: OBSIDIANTECHLAB S.A.S. (AGORA), ciudad de
              Guayaquil, Ecuador.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
