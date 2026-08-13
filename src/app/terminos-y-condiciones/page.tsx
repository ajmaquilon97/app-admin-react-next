import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y condiciones — RecreAdmin",
};

export default function TerminosYCondicionesPage() {
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

      <h1 className="mb-2 page-title">
        Términos y condiciones generales
      </h1>
      <p className="mb-10 text-sm text-text-muted">
        Última actualización: 27/07/2026
      </p>

      <p className="mb-10 text-sm leading-relaxed text-text-main">
        Los presentes términos y condiciones (en adelante, los &quot;Términos y Condiciones&quot;) de
        OBSIDIANTECHLAB S.A.S. (en adelante, &quot;AGORA&quot; o la &quot;Plataforma&quot;) regulan las condiciones
        aplicables a la contratación del servicio de marketplace de espacios ofrecido por AGORA.
        Los presentes Términos y Condiciones, junto con las Condiciones Particulares y los anexos
        que correspondan, así como las Políticas que AGORA emita de tiempo en tiempo, constituyen
        el conjunto integral de las condiciones de contratación entre AGORA y el cliente (en
        adelante, el &quot;Cliente&quot; y junto con AGORA, las &quot;Partes&quot;) y sustituyen cualquier comunicación
        anterior, verbal o escrita, entre las mismas.
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-text-main">
        <section>
          <h2 className="mb-3 subtitle">PRIMERO: DEFINICIONES</h2>
          <p className="mb-3">Para efectos de estos Términos y Condiciones, los siguientes términos tendrán las siguientes definiciones:</p>
          <p className="mb-3"><strong>Acuerdo:</strong> se entenderá como &quot;Acuerdo&quot; el conjunto integral de las condiciones establecidas entre las Partes, incluyendo los Términos y Condiciones, las Condiciones Particulares, las Políticas, y cualquier otro documento o contratación que AGORA implemente durante la vigencia de la relación comercial, con el propósito de regular dicha relación.</p>
          <p className="mb-3"><strong>Adeudos:</strong> cualquier suma que el Cliente le adeude a AGORA por cualquier concepto, incluyendo cargos por cancelación de Reservas imputables al Cliente, penalidades y/o recargos que puedan aplicar en virtud de la prestación del servicio, conforme a lo establecido en los presentes Términos y Condiciones y en la Política de Cancelaciones y No-Show.</p>
          <p className="mb-3"><strong>AGORA:</strong> plataforma tecnológica de marketplace de espacios operada por OBSIDIANTECHLAB S.A.S., con razón social inscrita en la República del Ecuador, con domicilio principal en la ciudad de Guayaquil.</p>
          <p className="mb-3"><strong>Cliente:</strong> persona natural o jurídica propietaria o que tiene legítima disponibilidad sobre uno o más Espacios, que se registra en el Portal con el objeto de publicar y hacer disponibles dichos Espacios para su reserva por parte de los Usuarios finales.</p>
          <p className="mb-3"><strong>Condiciones Particulares:</strong> condiciones especiales aplicables al Cliente por los Servicios Contratados y vigentes entre las Partes, acordadas al momento de la incorporación del Cliente al Portal.</p>
          <p className="mb-3"><strong>Espacio:</strong> inmueble, área, sala, local, recinto o cualquier espacio físico de titularidad o administración del Cliente, publicado en el Portal con el fin de ser reservado por los Usuarios mediante el servicio de marketplace de AGORA.</p>
          <p className="mb-3"><strong>Evento:</strong> modalidad de reserva de un Espacio por parte del Usuario para la realización de una actividad específica con duración determinada (conferencias, celebraciones, reuniones corporativas, sesiones fotográficas, entre otros), según lo definido en el Portal al momento de publicar el Espacio.</p>
          <p className="mb-3"><strong>Liquidación:</strong> proceso de compensación de cuentas del Cliente con AGORA, mediante el cual AGORA transfiere al Cliente el valor íntegro de las Reservas efectivamente realizadas, descontando únicamente los Adeudos aplicables conforme a estos Términos y Condiciones.</p>
          <p className="mb-3"><strong>Pasarela de Pago:</strong> proveedor de servicios de pago electrónico habilitado por AGORA para procesar las transacciones de los Usuarios, incluyendo tarjetas de débito, crédito y otros instrumentos de pago electrónico que AGORA admita a futuro.</p>
          <p className="mb-3"><strong>Período de Reserva:</strong> lapso de tiempo específico —por hora(s) o por Evento— durante el cual el Usuario tiene derecho a usar exclusivamente el Espacio reservado, conforme a lo pactado al momento de efectuarse la Reserva.</p>
          <p className="mb-3"><strong>Plataforma:</strong> la Web y la Aplicación Móvil de AGORA, como conjunto tecnológico.</p>
          <p className="mb-3"><strong>Políticas:</strong> cualesquiera políticas y lineamientos que de tiempo en tiempo emita AGORA, incluyendo pero no limitándose a la Política de Cancelaciones y No-Show.</p>
          <p className="mb-3"><strong>Portal del Anfitrión:</strong> sitio online de autogestión donde el Cliente puede revisar y administrar el perfil de su/s Espacio/s, configurar disponibilidad, precios, reglas del Espacio, revisar Reservas y acceder a reportes y estados de cuenta.</p>
          <p className="mb-3"><strong>Precio del Espacio:</strong> valor en dólares de los Estados Unidos de América (USD) fijado por el Cliente para la utilización de su Espacio por Período de Reserva o por Evento, publicado en la Plataforma y que constituye la contraprestación directa del Usuario al Cliente por el uso del Espacio.</p>
          <p className="mb-3"><strong>Propiedad Intelectual:</strong> cualquier derecho protegido por las leyes aplicables, incluyendo, pero sin limitarse a, derechos de autor, marcas comerciales, nombres comerciales, lemas, logotipos, patentes, secretos comerciales, diseños industriales, derechos sobre bases de datos, nombres de dominio, derechos de imagen, know-how, y cualquier otro derecho similar reconocido en cualquier jurisdicción, desarrollado de manera independiente por cualquiera de las Partes.</p>
          <p className="mb-3"><strong>Reserva:</strong> acto mediante el cual un Usuario selecciona y confirma la disponibilidad de un Espacio en un Período de Reserva determinado a través de la Plataforma, generando una obligación entre el Cliente y el Usuario conforme a los presentes Términos y Condiciones y las condiciones particulares del Espacio.</p>
          <p className="mb-3"><strong>Servicio de Pago Online:</strong> modalidad de pago que permite al Usuario abonar el valor de la Reserva a través de la Pasarela de Pago integrada en la Plataforma.</p>
          <p className="mb-3"><strong>Servicios Contratados:</strong> los servicios que se especifican en estos Términos y Condiciones, junto con los Servicios Complementarios contratados o que a futuro contrate el Cliente.</p>
          <p className="mb-3"><strong>Tarifa de Servicio:</strong> cargo que AGORA cobra directamente a los Usuarios por la utilización de la Plataforma como intermediario tecnológico, de manera independiente al Precio del Espacio fijado por el Cliente. La Tarifa de Servicio es un ingreso propio de AGORA y no forma parte del Precio del Espacio ni de la Liquidación al Cliente.</p>
          <p className="mb-3"><strong>Términos y Condiciones:</strong> las condiciones contenidas en este documento.</p>
          <p className="mb-3"><strong>Usuarios:</strong> personas naturales o jurídicas que acceden a la Plataforma con el fin de buscar, reservar y/o utilizar los Espacios disponibilizados por los Clientes.</p>
          <p className="mb-3"><strong>Web:</strong> página de internet https://www.agoraespacio.com.ec/ o cualquier otro dominio que AGORA designe.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">SEGUNDO: SERVICIOS</h2>
          <h3 className="mb-2 mt-6 card-title">2.1. Servicios ofrecidos por AGORA</h3>
          <p className="mb-3">AGORA pone a disposición de sus Clientes los servicios que se especifican a continuación, sin perjuicio de otros Servicios Complementarios que pudieran prestarse oportunamente.</p>
          <p className="mb-3">En caso de ser contratados Servicios Complementarios, las condiciones deberán acordarse mutuamente entre las Partes. A tales Servicios Complementarios les serán aplicables de manera supletoria los presentes Términos y Condiciones, en lo que no se regule de manera específica en los términos de los Servicios Complementarios.</p>
          <h3 className="mb-2 mt-6 card-title">2.1.1. Servicio de Marketplace de Espacios</h3>
          <p className="mb-3">AGORA pone a disposición de sus Clientes el Servicio de Marketplace de Espacios a través de la Web y/o la Aplicación Móvil, permitiendo a los Usuarios realizar Reservas de los Espacios publicados por el Cliente.</p>
          <p className="mb-3">En el marco del Servicio de Marketplace, AGORA: (i) exhibirá los Espacios del Cliente en la Plataforma conforme a estos Términos y Condiciones y demás condiciones que AGORA pueda establecer; (ii) canalizará a través del Portal las Reservas realizadas por los Usuarios y las comunicará al Cliente en tiempo real; (iii) procesará, a través de la Pasarela de Pago, el cobro del Precio del Espacio a los Usuarios en nombre del Cliente; y (iv) cobrará a los Usuarios, de manera independiente y en nombre propio, la Tarifa de Servicio de AGORA por la utilización de la Plataforma.</p>
          <p className="mb-3">Se deja expresa constancia que AGORA no garantiza el acceso y/o uso continuado o ininterrumpido de la Plataforma. La Plataforma puede eventualmente no estar disponible debido a dificultades técnicas, fallas de Internet u cualquier otra circunstancia ajena o propia de AGORA. En tales casos, se procurará restablecerla con la mayor celeridad posible, sin que por ello pueda imputársele algún tipo de responsabilidad y/o incumplimiento a AGORA.</p>
          <h3 className="mb-2 mt-6 card-title">2.1.2. Condiciones generales del Servicio de Marketplace de Espacios</h3>
          <p className="mb-3"><strong>Es obligación del Cliente:</strong> i) publicar los Espacios en la Plataforma con información veraz, precisa y actualizada, incluyendo descripción, fotografías, capacidad, ubicación, amenidades disponibles, reglamento de uso y Precio del Espacio; ii) suministrar oportunamente a AGORA o actualizar directamente a través del Portal del Anfitrión cualquier modificación o actualización que pretenda efectuar respecto de la información del Espacio publicado, incluyendo cambios en disponibilidad, precio y condiciones de uso; iii) mantener los Espacios en las condiciones descritas en la Plataforma, garantizando que cumplan con los estándares de seguridad, limpieza, salubridad e infraestructura declarados; iv) obtener y mantener vigentes, por su propia cuenta y riesgo, todos los permisos, licencias y/o autorizaciones que se requieran para habilitar y destinar el Espacio al uso ofertado, así como cumplir con la normativa vigente aplicable, incluyendo las disposiciones relativas a permisos de uso de suelo, normativa de seguridad, aforo máximo y cualquier otra regulación municipal o nacional aplicable; v) confirmar o rechazar las Reservas dentro del plazo que AGORA establezca; vi) garantizar al Usuario el acceso al Espacio durante el Período de Reserva confirmado; vii) emitir el comprobante de venta electrónico (factura) al Usuario por el Precio del Espacio, de conformidad con la normativa del Servicio de Rentas Internas del Ecuador (SRI) vigente, siendo el Cliente el único responsable del cumplimiento de sus obligaciones tributarias y de facturación frente al Usuario y ante el SRI; viii) atender los reclamos que sean presentados por los Usuarios en relación con el uso del Espacio, colaborando con AGORA en la resolución de los mismos; ix) cumplir con los indicadores de desempeño que AGORA comunique oportunamente; x) no promocionar ni publicitar otros canales de reserva directa durante el proceso de atención de Reservas gestionadas a través de la Plataforma; y xi) evitar prácticas que desincentiven la utilización de la Plataforma, absteniéndose de realizar acciones que puedan perjudicar o denostar la marca o la calidad de los servicios ofrecidos por AGORA.</p>
          <p className="mb-3">AGORA gestionará los reclamos que se le presenten por los Usuarios en relación con las Reservas realizadas a través de la Plataforma. Sin perjuicio de ello, el Cliente se compromete a mantener un canal de comunicación con los Usuarios en caso de que éstos deseen contactarlo. El vínculo entre AGORA y el Usuario final no queda comprendido en el objeto de estos Términos y Condiciones, siendo responsabilidad del Cliente la relación con el Usuario respecto al uso del Espacio. El Cliente será el único responsable ante los Usuarios por las condiciones, características, estado y funcionamiento del Espacio, atendiendo oportunamente todos los reclamos presentados por los Usuarios, debiendo el Cliente mantener a AGORA indemne y a salvo de cualquier reclamo o denuncia de cualquier naturaleza que pudiera derivarse directa o indirectamente del Espacio o del servicio prestado por el Cliente.</p>
          <h3 className="mb-2 mt-6 card-title">2.1.3. Tarifa de Servicio al Usuario</h3>
          <p className="mb-3">El Cliente conoce y acepta que AGORA cobra a los Usuarios, de manera autónoma e independiente, una Tarifa de Servicio por la utilización de la Plataforma como intermediario tecnológico. Dicha Tarifa de Servicio es adicionada al Precio del Espacio al momento en que el Usuario realiza la Reserva, y es un ingreso exclusivo de AGORA.</p>
          <p className="mb-3">La Tarifa de Servicio es un concepto independiente del Precio del Espacio fijado por el Cliente. AGORA emitirá al Usuario la factura electrónica correspondiente por la Tarifa de Servicio cobrada, en cumplimiento de la normativa tributaria ecuatoriana. La facturación del Precio del Espacio al Usuario es de exclusiva responsabilidad del Cliente, conforme a lo establecido en la sección 2.1.2 numeral vii).</p>
          <p className="mb-3">El valor de la Tarifa de Servicio podrá ser actualizado por AGORA de tanto en tanto, sin que ello requiera autorización del Cliente, dado que constituye un cobro de AGORA al Usuario por sus propios servicios.</p>
          <h3 className="mb-2 mt-6 card-title">2.1.4. Acceso al Portal del Anfitrión</h3>
          <p className="mb-3">Junto con la incorporación del Cliente a la Plataforma, este recibirá acceso al Portal del Anfitrión. En el mismo, podrá autogestionar funcionalidades tales como:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Creación y modificación del perfil del/los Espacio/s.</li>
            <li>Configuración de disponibilidad, tarifas y horarios del Espacio.</li>
            <li>Gestión y confirmación de Reservas.</li>
            <li>Configuración de las reglas y reglamento de uso del Espacio.</li>
            <li>Obtención de reportes de Reservas, ingresos y desempeño.</li>
            <li>Revisión y descarga de los estados de cuenta y liquidaciones semanales.</li>
            <li>Acceso a comentarios y calificaciones de Usuarios respecto a su Espacio.</li>
          </ul>
          <p className="mb-3">El Cliente recibirá un único acceso inicial de administrador (&quot;admin owner&quot;), el cual le permitirá autogestionar su perfil. A través de este acceso podrá crear otros usuarios con distintos niveles de permiso para gestionar su/s Espacio/s dentro del Portal. El Cliente será el único responsable por mantener su contraseña de manera confidencial, de los accesos que otorgue para operar dentro del Portal del Anfitrión y por todas las gestiones que se realicen en y desde su cuenta, deslindando a AGORA de responsabilidad frente a cualquier mal uso que se le dé al mismo.</p>
          <h3 className="mb-2 mt-6 card-title">2.1.5. Servicio de Pago Online</h3>
          <p className="mb-3">Con la incorporación del Cliente a la Plataforma, el mismo adhiere al Servicio de Pago Online como modalidad de procesamiento de pagos por Reservas. Los Usuarios abonarán, a través de la Pasarela de Pago integrada en la Plataforma, el Precio del Espacio (en nombre del Cliente) y la Tarifa de Servicio (en nombre de AGORA), en una sola transacción.</p>
          <p className="mb-3">AGORA recibirá, a través del proveedor de la Pasarela de Pago, las sumas correspondientes al Precio del Espacio generadas por las transacciones en la Plataforma, realizará la Liquidación que corresponda y transferirá al Cliente el valor íntegro de las Reservas efectivamente realizadas, descontando únicamente los Adeudos aplicables. La Tarifa de Servicio cobrada al Usuario es retenida por AGORA directamente y no forma parte de la Liquidación al Cliente.</p>
          <p className="mb-3">El Cliente comprende y acepta que la responsabilidad de AGORA en el marco del Servicio de Pago Online se limita a las gestiones administrativas correspondientes para realizar las transferencias que correspondan al Cliente, no siendo AGORA responsable por cualquier falta de disponibilidad transitoria o permanente de la Pasarela de Pago, redes o prestadores de servicios de pagos en línea, ni demora o atraso en los procesos requeridos para dichas transferencias.</p>
          <h3 className="mb-2 mt-6 card-title">2.2. Servicios Complementarios</h3>
          <p className="mb-3">Al momento de la contratación del servicio, se detallarán en las Condiciones Particulares los Servicios Complementarios contratados por el Cliente. AGORA podrá ofrecer al Cliente distintas acciones comerciales y programas de visibilidad y posicionamiento dentro de la Plataforma. AGORA informará al Cliente los términos y condiciones aplicables a la contratación de dichas acciones, las cuales deberán ser aceptadas oportunamente por el Cliente. AGORA se reserva el derecho de admitir o no cualquier acción comercial que el Cliente desee realizar.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">TERCERO: PRECIO DEL SERVICIO PARA EL CLIENTE</h2>
          <h3 className="mb-2 mt-6 card-title">3.1. Gratuidad del servicio de marketplace para el Cliente</h3>
          <p className="mb-3">La incorporación y utilización del Servicio de Marketplace de Espacios de AGORA no tiene costo ni comisión para el Cliente durante la vigencia del modelo de ingresos establecido en estos Términos y Condiciones. AGORA genera sus ingresos exclusivamente a través de la Tarifa de Servicio cobrada directamente a los Usuarios, conforme a lo descrito en la sección 2.1.3.</p>
          <p className="mb-3">El Cliente recibirá en la Liquidación el valor íntegro del Precio del Espacio correspondiente a las Reservas efectivamente realizadas, descontando únicamente los Adeudos que correspondan conforme a la Política de Cancelaciones y No-Show.</p>
          <p className="mb-3">AGORA se reserva el derecho de introducir, en el futuro, nuevos modelos de precio o comisiones aplicables al Cliente, para lo cual notificará al Cliente con al menos quince (15) días naturales de anticipación. El Cliente, en caso de no estar de acuerdo con las nuevas condiciones, podrá terminar el Acuerdo mediante simple aviso antes de la entrada en vigor de las mismas, sin que ello genere responsabilidad alguna para AGORA.</p>
          <h3 className="mb-2 mt-6 card-title">3.2. Tarifa de Incorporación (Set-Up Fee)</h3>
          <p className="mb-3">Con la incorporación del Cliente a la Plataforma y como consecuencia del alta del Espacio en el Portal, el Cliente deberá abonar por única vez los costos de configuración y activación del perfil del Espacio, bajo el concepto &quot;Set Up Fee&quot;, de conformidad con lo indicado en las Condiciones Particulares. Esta tarifa podrá ser eximida o ajustada conforme a los términos comerciales acordados entre las Partes.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">CUARTO: FACTURACIÓN, LIQUIDACIÓN Y OBLIGACIONES TRIBUTARIAS</h2>
          <h3 className="mb-2 mt-6 card-title">4.1. Documentos tributarios y responsabilidades de cada Parte</h3>
          <p className="mb-3">Las Partes reconocen expresamente el siguiente esquema de facturación, en cumplimiento de la normativa tributaria de la República del Ecuador:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>AGORA → Usuario: AGORA emitirá al Usuario el comprobante de venta electrónico correspondiente únicamente por la Tarifa de Servicio cobrada por el uso de la Plataforma. Este es un ingreso propio de AGORA y su facturación es de exclusiva responsabilidad de AGORA.</li>
            <li>Cliente → Usuario: El Cliente es el único responsable de emitir al Usuario el comprobante de venta electrónico (factura) por el Precio del Espacio correspondiente a la Reserva, de conformidad con la normativa del SRI. AGORA actúa como mandatario de cobro del Precio del Espacio, mas no asume ninguna obligación de facturación en nombre del Cliente. El incumplimiento de esta obligación por parte del Cliente constituirá una infracción tributaria de su exclusiva responsabilidad.</li>
            <li>AGORA → Cliente (cuando aplique): En caso de que, en el futuro, se introduzcan comisiones u otros cargos al Cliente conforme a la sección 3.1, AGORA emitirá al Cliente la factura electrónica correspondiente con el IVA aplicable.</li>
          </ul>
          <p className="mb-3">El Cliente reconoce que AGORA recauda el Precio del Espacio en calidad de mandatario de cobro del Cliente, lo que no transfiere a AGORA ninguna obligación tributaria propia del Cliente. El Cliente mantiene en todo momento su condición de proveedor del servicio de uso del Espacio frente al Usuario y frente al SRI.</p>
          <h3 className="mb-2 mt-6 card-title">4.2. Liquidación semanal</h3>
          <p className="mb-3">AGORA realizará una Liquidación semanal al Cliente, transfiriendo el valor íntegro del Precio del Espacio correspondiente a las Reservas efectivamente realizadas en el período, descontando únicamente los Adeudos aplicables conforme a la Política de Cancelaciones y No-Show.</p>
          <p className="mb-3">Junto con cada Liquidación, AGORA entregará al Cliente un estado de cuenta detallado que incluirá: número y fecha de cada Reserva liquidada, Precio del Espacio por Reserva, Adeudos descontados (si los hubiere) y el monto neto transferido. Este documento constituye el respaldo contable de la Liquidación, sin perjuicio de los comprobantes de venta que el Cliente deba emitir al Usuario por su cuenta.</p>
          <p className="mb-3">El Cliente acepta que cuenta con un plazo máximo de veinticinco (25) días calendario desde comunicada cada Liquidación para presentar comentarios u observaciones; pasado dicho plazo se entenderá que la Liquidación ha sido aceptada y cualquier inexactitud u error queda condonada, sin opción a reclamo posterior.</p>
          <p className="mb-3">Las fechas de Liquidación serán comunicadas mediante correo electrónico y/o Portal del Anfitrión y podrán ser modificadas de tanto en tanto, previa notificación al Cliente.</p>
          <h3 className="mb-2 mt-6 card-title">4.3. Adeudos y descuentos en Liquidación</h3>
          <p className="mb-3">Los únicos conceptos que AGORA podrá descontar de la Liquidación al Cliente son los Adeudos derivados de: i) cargos por cancelación de Reservas imputables al Cliente conforme a la Política de Cancelaciones y No-Show; ii) devoluciones a Usuarios por causas imputables al Cliente; y iii) cualquier otro cargo expresamente pactado entre las Partes en las Condiciones Particulares.</p>
          <p className="mb-3">En caso de que los Adeudos superen el monto de la Liquidación de un período determinado, el saldo deudor será arrastrado al siguiente período de Liquidación. Si persistiera el Adeudo luego de tres (3) períodos consecutivos de Liquidación, AGORA podrá requerir al Cliente el pago directo del saldo pendiente dentro de los treinta (30) días siguientes a la notificación respectiva.</p>
          <p className="mb-3">AGORA podrá retener y/o compensar de cualquier suma que deba transferir al Cliente, los montos que el Cliente le adeude por cualquier concepto exigible.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">QUINTO: POLÍTICA DE CANCELACIONES Y NO-SHOW</h2>
          <h3 className="mb-2 mt-6 card-title">5.1. Política base de AGORA</h3>
          <p className="mb-3">AGORA establece como política base las siguientes condiciones para todas las Reservas gestionadas a través de la Plataforma, salvo que el Cliente configure condiciones distintas en el Portal del Anfitrión conforme a la sección 5.2:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Cancelación por el Usuario con más de 24 horas de anticipación al inicio del Período de Reserva: el Usuario tiene derecho a la devolución total del Precio del Espacio pagado. AGORA reintegrará al Usuario el monto cobrado y no se aplicará Adeudo alguno al Cliente.</li>
            <li>Cancelación por el Usuario con menos de 24 horas de anticipación al inicio del Período de Reserva: el Usuario no tendrá derecho a devolución del Precio del Espacio, salvo circunstancias de fuerza mayor debidamente acreditadas. El Cliente recibirá en la Liquidación el valor íntegro del Precio del Espacio.</li>
            <li>Cancelación por el Cliente: en caso de que el Cliente cancele una Reserva ya confirmada, AGORA procederá a devolver al Usuario el Precio del Espacio pagado. El costo de dicha devolución será asumido íntegramente por el Cliente y constituirá un Adeudo descontable en la siguiente Liquidación. La cancelación reiterada de Reservas confirmadas por parte del Cliente se considerará un incumplimiento grave al Acuerdo.</li>
            <li>No-Show del Usuario (inasistencia sin cancelación previa): si el Usuario no se presenta al Espacio dentro del tiempo de gracia de quince (15) minutos desde el inicio del Período de Reserva, sin haber cancelado previamente, no tendrá derecho a devolución alguna. El Cliente recibirá el valor íntegro del Precio del Espacio en la Liquidación.</li>
            <li>No-Show del Cliente (imposibilidad de acceso al Espacio): si el Usuario no puede acceder al Espacio por causas imputables al Cliente (Espacio cerrado, en condiciones distintas a las publicadas, o acceso negado), AGORA procederá a la devolución total del Precio del Espacio al Usuario. El monto devuelto constituirá un Adeudo a cargo del Cliente, descontable en la siguiente Liquidación.</li>
          </ul>
          <h3 className="mb-2 mt-6 card-title">5.2. Política personalizada del Cliente</h3>
          <p className="mb-3">Adicionalmente a la política base establecida en la sección 5.1, el Cliente podrá configurar a través del Portal del Anfitrión condiciones de cancelación personalizadas para su/s Espacio/s, las cuales serán exhibidas al Usuario al momento de realizar la Reserva. Estas condiciones podrán contemplar, entre otras: períodos de cancelación gratuita más o menos amplios, tarifas de cancelación diferenciadas según el tipo de Reserva (por hora o por Evento), y depósitos o anticipos no reembolsables.</p>
          <p className="mb-3">Las condiciones personalizadas no podrán contravenir la normativa de protección al consumidor vigente en el Ecuador ni las disposiciones mínimas establecidas en estos Términos y Condiciones. AGORA se reserva el derecho de revisar y, en su caso, objetar condiciones que considere abusivas o contrarias a las Políticas de la Plataforma.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">SEXTO: CONFIDENCIALIDAD Y TRATAMIENTO DE DATOS</h2>
          <p className="mb-3">Las Partes se obligan a no revelar a terceros ninguna información comercial o de cualquier otro tipo acerca de AGORA o del Cliente, a la que tengan acceso en virtud de la prestación de los servicios que se regulan en este Acuerdo, obligándose a mantener la confidencialidad de la misma, incluso por el plazo de cinco (5) años después de finalizada la relación comercial. Las Partes podrán únicamente revelar información cuando la otra Parte lo autorice especialmente a estos efectos o por resolución de autoridad competente.</p>
          <p className="mb-3">Para el cumplimiento de los Servicios Contratados, AGORA compartirá con el Cliente cierta información de los Usuarios necesaria para que el Cliente cumpla con sus obligaciones frente a éstos. El Cliente reconoce y acepta que no podrá utilizar, reproducir, almacenar, enajenar, transferir, contactar directamente al Usuario, compartir ni de ninguna otra forma disponer, de forma total o parcial, dicha información, más allá del estricto cumplimiento de sus obligaciones frente al Usuario derivadas de la Reserva. El incumplimiento de lo previsto en este apartado por parte del Cliente se considerará un incumplimiento grave, pudiendo AGORA suspender los Servicios Contratados y/o dar por finalizada la relación contractual.</p>
          <p className="mb-3">Sin perjuicio de lo anterior, AGORA podrá utilizar toda la información producida por su Plataforma sobre los Espacios, Reservas y demás transacciones para fines de comercialización, mejora del servicio y análisis estadístico, para lo cual el Cliente otorga su consentimiento expreso, libre y voluntario.</p>
          <p className="mb-3">AGORA se compromete a tratar los datos personales que el Cliente le suministre de conformidad con la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP) y su Reglamento. El Cliente reconoce haber leído y aceptado la Política de Privacidad de AGORA disponible en la Plataforma.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">SÉPTIMO: PROPIEDAD INTELECTUAL</h2>
          <p className="mb-3"><strong>El Cliente declara y garantiza que:</strong> a) su Propiedad Intelectual es válida y ejecutable y tiene los derechos suficientes para otorgar las presentes licencias a AGORA; b) es titular de los derechos de propiedad intelectual sobre el material multimedia entregado a AGORA (fotografías del Espacio, logotipos, nombre comercial, entre otros), respondiendo por cualquier infracción ante terceros e indemnizando cualquier daño que pueda sufrir AGORA; c) no tiene conocimiento de terceros que infrinjan su Propiedad Intelectual; y d) cualquier acto que pueda realizar AGORA en virtud del Acuerdo no infringirá derechos de terceros.</p>
          <p className="mb-3">Al aceptar los presentes Términos y Condiciones, el Cliente otorga a AGORA una licencia no exclusiva, sublicenciable, sin regalías y sin limitación de territorio, para utilizar su Propiedad Intelectual (incluyendo marca/s, logo/s, nombre/s comercial/es, material multimedia del Espacio) en la Plataforma y en medios de comunicación de AGORA con el fin de promover el Espacio y la Plataforma.</p>
          <p className="mb-3">El Cliente reconoce la titularidad de AGORA sobre la Plataforma y las marcas &quot;AGORA&quot;, no adquiriendo derecho de propiedad alguno ni licencia de uso sobre las mismas. Está prohibida la reproducción, modificación, distribución, ingeniería inversa o réplica de la Plataforma y de las marcas de AGORA.</p>
          <p className="mb-3">El Cliente mantendrá indemne e indemnizará a AGORA en caso de cualquier reclamo o daño derivado de la inexactitud o falsedad de las declaraciones realizadas en esta cláusula.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">OCTAVO: ANTICORRUPCIÓN Y ANTISOBORNO</h2>
          <p className="mb-3">El Cliente acepta cumplir íntegramente con todas las normas anticorrupción y antisoborno aplicables en el Ecuador, y obliga así también a sus afiliadas, directivos, empleados, agentes y subcontratistas a no llevar a cabo ni ofrecer ningún tipo de pagos, obsequios o beneficios que tengan como propósito realizar un soborno o influenciar indebidamente una decisión relacionada con la presente relación comercial. AGORA tendrá derecho a rescindir el Acuerdo con efecto inmediato en caso de que concluya que el Cliente ha cometido una violación de las normas anticorrupción aplicables.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">NOVENO: RESPONSABILIDAD E INDEMNIDAD</h2>
          <h3 className="mb-2 mt-6 card-title">9.1. Responsabilidad</h3>
          <p className="mb-3">AGORA en ningún caso asume responsabilidad alguna, tanto frente a los Usuarios como frente al Cliente o cualquier tercero, y en consecuencia el Cliente mantendrá indemne y a salvo a AGORA, por:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>la información sobre el/los Espacio/s del Cliente que aparecerá en la Plataforma, que AGORA exhibirá conforme a lo indicado por el Cliente;</li>
            <li>las condiciones, características, estado de mantenimiento, seguridad o limpieza del Espacio del Cliente;</li>
            <li>la falta de permisos, licencias o habilitaciones que se requieran para que el Cliente pueda ofrecer el Espacio;</li>
            <li>cualquier daño personal, material o de otra naturaleza que sufra el Usuario o cualquier tercero durante o como consecuencia del uso del Espacio;</li>
            <li>el incumplimiento por parte del Cliente de sus obligaciones de facturación electrónica al Usuario ante el SRI;</li>
            <li>los daños que pudiera sufrir el Cliente por los comentarios y calificaciones que los Usuarios realizaren en la Plataforma respecto al Espacio;</li>
            <li>cualquier reclamo del Usuario relacionado con las condiciones, calidad o características del Espacio ofrecido por el Cliente;</li>
            <li>supuestos de fuerza mayor o caso fortuito.</li>
          </ul>
          <h3 className="mb-2 mt-6 card-title">9.2. Indemnidad</h3>
          <p className="mb-3">El Cliente se compromete a indemnizar y mantener indemne a AGORA respecto de cualquier daño y cualquier demanda, acción o reclamo de cualquier naturaleza proveniente de Usuarios, empleados, colaboradores o terceros en general, que estén relacionados con el Cliente o por quienes el Cliente deba responder, incluyendo los costos razonables de asesoramiento legal en que efectivamente se incurra.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO: PLAZO</h2>
          <p className="mb-3">El plazo se regirá de acuerdo con lo establecido en las Condiciones Particulares para cada servicio contratado. En caso de que no se indique un plazo, se considerará que el Acuerdo es por plazo indeterminado. En caso de plazo determinado, el servicio se renovará automáticamente a su vencimiento por períodos de igual duración, sin perjuicio de lo estipulado en el apartado Terminación Unilateral de los presentes Términos y Condiciones.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO PRIMERO: INCUMPLIMIENTO Y TERMINACIÓN</h2>
          <h3 className="mb-2 mt-6 card-title">11.1. Mora automática</h3>
          <p className="mb-3">La mora operará de forma automática y de pleno derecho, sin necesidad de protesto ni interpelación alguna, por el solo vencimiento de los plazos o por la realización u omisión de cualquier acto contrario a lo estipulado. En ese caso, AGORA tendrá derecho a aplicar la máxima tasa moratoria permitida por la regulación ecuatoriana sobre cualquier Adeudo del Cliente.</p>
          <h3 className="mb-2 mt-6 card-title">11.2. Suspensión en la ejecución de los servicios</h3>
          <p className="mb-3">En caso de incumplimiento por parte del Cliente a alguna de sus obligaciones (incluyendo sin limitación: saldos de Adeudos impagos, fraude, publicación de Espacios con información falsa o engañosa, incumplimiento reiterado de las condiciones de las Reservas confirmadas, irregularidades en la cuenta, entre otros), AGORA estará facultada, a su solo arbitrio, a suspender total o parcialmente la ejecución de los Servicios Contratados, hasta que la situación sea regularizada, mediante simple notificación al Cliente.</p>
          <h3 className="mb-2 mt-6 card-title">11.3. Terminación por incumplimiento</h3>
          <p className="mb-3">En caso de incumplimiento de una Parte de cualquiera de las obligaciones asumidas en virtud del presente Acuerdo, la parte cumplida podrá terminarlo anticipadamente si subsistiese el incumplimiento luego de diez (10) días naturales desde que la parte cumplida hubiere intimado por medio fehaciente a subsanarlo. En caso de fraude por parte del Cliente, AGORA quedará facultada automáticamente a suspender la prestación del servicio, sin necesidad de preaviso alguno y sin que ello genere derecho a compensación o indemnización alguna a favor del Cliente.</p>
          <h3 className="mb-2 mt-6 card-title">11.4. Terminación unilateral</h3>
          <p className="mb-3">Cualquiera de las Partes podrá terminar unilateralmente el Acuerdo, en cualquier momento, comunicando su intención a la otra Parte con al menos quince (15) días naturales de antelación, sin que por esta terminación se genere indemnización alguna a favor de la otra Parte. Esta terminación no liberará al Cliente de los Adeudos pendientes ni de las obligaciones asumidas con anterioridad a la fecha efectiva de la terminación.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO SEGUNDO: NATURALEZA DE LA RELACIÓN</h2>
          <p className="mb-3">La relación emergente de este Acuerdo es estrictamente comercial. Las Partes reconocen expresamente que la vinculación entre éstas es independiente y que no existe ningún tipo de relación diferente a la comercial. El presente vínculo no crea entre las Partes una relación de subordinación, empleo, asociación, agencia, empresa conjunta ni de similar naturaleza. Cada Parte es exclusivamente responsable de sus obligaciones tributarias, laborales, provisionales y administrativas propias.</p>
          <p className="mb-3">AGORA actúa como intermediario tecnológico entre el Cliente y el Usuario. AGORA no es propietaria ni administradora de ninguno de los Espacios publicados en la Plataforma, y no es parte en el contrato de uso del Espacio que se perfecciona entre el Cliente y el Usuario al confirmarse la Reserva. La recaudación del Precio del Espacio por parte de AGORA se realiza en calidad de mandatario de cobro del Cliente.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO TERCERO: MODIFICACIONES AL ACUERDO</h2>
          <p className="mb-3">El Acuerdo podrá ser modificado por AGORA. En cualquier caso, AGORA notificará al Cliente cada cambio con quince (15) días naturales previos a su entrada en vigor. El Cliente tendrá ese plazo para manifestar su disconformidad y rescindir el Acuerdo mediante simple aviso. De no pronunciarse en el plazo previsto, se entenderá que los cambios fueron aceptados.</p>
          <p className="mb-3">Si ambas Partes deciden modificar las condiciones del Acuerdo de mutuo acuerdo, estas modificaciones deberán acordarse por escrito.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO CUARTO: INACCIÓN</h2>
          <p className="mb-3">La falta de ejercicio en alguna oportunidad de cualquiera de los derechos emergentes de los presentes Términos y Condiciones no será interpretada como una renuncia a ejercerlos, ni precluirá la posibilidad de ejercerlos en cualquier oportunidad ulterior.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO QUINTO: CESIÓN DE CRÉDITOS Y CESIÓN DE ACUERDO</h2>
          <p className="mb-3">El Cliente acepta y autoriza de forma expresa que AGORA podrá ceder los créditos a cobrar del Cliente, sin que para ello sea necesaria notificación ni aprobación previa del Cliente, pues su aprobación consta de la aceptación de los presentes Términos y Condiciones.</p>
          <p className="mb-3">AGORA podrá ceder la prestación del servicio, sus derechos u obligaciones o su posición contractual a un tercero, en cualquier momento, mediante acto que deberá ser posteriormente notificado al Cliente. El Cliente manifiesta en este acto su aceptación a cualquier cesión que AGORA realice y que le sea notificada una vez realizada.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO SEXTO: NULIDAD PARCIAL</h2>
          <p className="mb-3">Si cualquier disposición del Acuerdo es calificada como inválida, ilegal, inaplicable o inejecutable por un tribunal competente, las demás disposiciones del Acuerdo permanecerán vigentes y válidas, y serán aplicables con todos los efectos previstos por las leyes aplicables.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO SÉPTIMO: IMPUESTOS</h2>
          <p className="mb-3">Cada Parte tributará y responderá en relación con los impuestos que le correspondan de conformidad con los derechos y obligaciones establecidos en la presente, de conformidad con la legislación tributaria vigente en el Ecuador, incluyendo la Ley de Régimen Tributario Interno y sus reglamentos. Las obligaciones tributarias del Cliente frente al SRI, incluyendo la emisión de comprobantes de venta electrónicos al Usuario por el Precio del Espacio, son de exclusiva responsabilidad del Cliente.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO OCTAVO: LEY APLICABLE Y ARBITRAJE</h2>
          <p className="mb-3">Este Acuerdo será regido e interpretado de acuerdo a las leyes de la República del Ecuador.</p>
          <p className="mb-3">Todo litigio, controversia, desavenencia o reclamación que no pueda resolverse directamente y de manera amigable, resultante, relacionada o derivada de este Acuerdo, será resuelta mediante arbitraje de derecho y se someterá al procedimiento arbitral en el Centro de Arbitraje y Mediación de la Cámara de Comercio de Guayaquil, bajo lo dispuesto por la Ley de Arbitraje y Mediación del Ecuador y el Reglamento del Centro mencionado.</p>
          <p className="mb-3">El Tribunal Arbitral estará conformado por un (1) solo árbitro si la cuantía no supera los cincuenta mil dólares (USD 50.000) y por tres (3) árbitros si la cuantía supera este monto. Las Partes renuncian a la jurisdicción ordinaria y se obligan a acatar el laudo que expida el Tribunal Arbitral. El lugar de arbitraje será las instalaciones del Centro de Arbitraje y Mediación de la Cámara de Comercio de Guayaquil. El proceso será confidencial y el Tribunal Arbitral fallará en Derecho.</p>
          <p className="mb-3">Las disposiciones de la presente cláusula sobrevivirán a la resolución o terminación del presente Acuerdo.</p>
        </section>

        <section>
          <h2 className="mb-3 subtitle">DÉCIMO NOVENO: DOMICILIOS Y NOTIFICACIONES</h2>
          <p className="mb-3">A todos los efectos legales y procesales a que diera lugar este Acuerdo, las Partes constituyen domicilio en el indicado en las Condiciones Particulares.</p>
          <p className="mb-3">Las Partes acuerdan como medio idóneo de notificación y comunicación el correo electrónico señalado a continuación:</p>
          <p className="mb-3"><strong>A AGORA:</strong> Al correo electrónico legal@agoraespacio.com.ec.</p>
          <p className="mb-3"><strong>Al Cliente:</strong> Al correo electrónico señalado en las Condiciones Particulares.</p>
          <p className="mb-3">Los domicilios estarán vigentes salvo que cualquiera de las Partes comunique por escrito a la otra su cambio de domicilio, con por lo menos diez (10) días hábiles de antelación.</p>
        </section>

      </div>
    </main>
  );
}
