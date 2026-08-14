# Confirmaciones y pendientes — respuesta a `backend-addendum-facturas-response.md`

> **De:** equipo Frontend (Next.js)
> **Para:** equipo Backend (ApiTesis / .NET)
> **Contexto:** respuesta a los 2 puntos que pedían confirmación y 2 hallazgos nuevos
> al cruzar la respuesta contra `docs/swagger-api-login.json` actualizado.

---

## 1. Asunto del correo — confirmado, usar `EmisorNombreComercial`

Sí, cambien la plantilla de `FacturaEmailBuilder.ConstruirAsunto` a:

```
Tu factura de {EmisorNombreComercial} — Reserva {CodigoReserva}
```

Como dijeron, con `EmisorRazonSocial` los dos correos de una misma reserva llegan con
el mismo asunto exacto — con `EmisorNombreComercial` el cliente distingue de un
vistazo cuál es la del espacio ("Quinta Los Almendros") y cuál la de Agora, sin tener
que abrir ambos.

## 2. `POST /api/facturas/{id}/reenviar-email` — confirmado, sí lo necesitamos

Con `emailEnviado`/`fechaEnvioEmail` ya visibles en el panel, ese es justo el
escenario que esos campos existen para detectar ("autorizada ante el SRI pero el
correo nunca llegó") — sin un botón de reenvío el admin ve el problema pero no puede
resolverlo desde el panel. Contrato esperado del lado del frontend:

```
POST /api/facturas/{id}/reenviar-email
→ 200 OK, actualiza emailEnviado=true y fechaEnvioEmail al momento del reenvío exitoso
→ 400/502 (o el código que prefieran) si el SMTP vuelve a fallar, sin tocar el estado
  Autorizada de la factura (mismo principio de aislamiento que ya implementaron en
  ProcesarAsync)
```

---

## 3. ⚠️ Pendiente real: `numeroRuc` no llegó a `CompletarPerfilRequest`

Esto lo pedimos en `docs/backend-cambios-solicitados.md` §8 hace un tiempo. Revisando
`docs/swagger-api-login.json` actualizado, el schema sigue así:

```json
"CompletarPerfilRequest": {
  "properties": { "tipoUsuarioId", "nombre", "apellido", "numeroCedula",
                   "fechaNacimiento", "rutaFotoCedula", "fotoPerfilUrl" },
  "additionalProperties": false
}
```

Sin `numeroRuc`. Ya agregamos el campo al formulario de onboarding de nuestro lado
(`OnboardingWizard.tsx`) y lo estamos mandando en el `PUT /api/usuarios/{id}` — con
`additionalProperties: false` puesto, ese campo hoy se rechaza o se descarta
silenciosamente. Este es el mismo RUC que después identifica al anfitrión como
comprador/emisor en el flujo de facturación, así que es un bloqueante real para poder
probar el onboarding completo de punta a punta. ¿Lo pueden agregar?

## 4. ⚠️ Pregunta: ¿`GET /api/facturas` / `GET /api/financiero/resumen` incluyen la factura del fee de Agora?

Cada reserva pagada genera **2 facturas** (`reserva_espacio` del anfitrión,
`fee_plataforma` de Agora — según `tipoFactura`, visible hoy solo en el endpoint
móvil `GET /api/mobile/reservas/{reservaId}/facturas`).

En el panel del anfitrión (`/financiero`), tanto el listado `GET /api/facturas` como
el resumen `GET /api/financiero/resumen` (`ingresosMes`, `facturasAutorizadas`, etc.)
**no muestran `tipoFactura`** en los ejemplos que compartieron. Necesitamos saber:

- ¿Esos dos endpoints devuelven **solo** las facturas `reserva_espacio` del
  anfitrión, excluyendo la del fee de Agora? (es lo que esperaríamos — el fee no es
  ingreso del anfitrión, es de la plataforma), **o**
- ¿Vienen mezcladas las dos?

Si vienen mezcladas, el anfitrión va a ver en su panel financiero facturas y montos
que no son su propio ingreso — necesitaríamos que `GET /api/facturas` exponga
`tipoFactura` (igual que el endpoint móvil) para poder filtrar, y que
`GET /api/financiero/resumen` calcule `ingresosMes`/`facturasAutorizadas` solo sobre
`reserva_espacio`.

---

## Checklist

- [ ] Cambiar plantilla de asunto a `EmisorNombreComercial` (§1, confirmado)
- [ ] Agregar `POST /api/facturas/{id}/reenviar-email` (§2, confirmado)
- [ ] Agregar `numeroRuc` a `CompletarPerfilRequest` (§3, bloqueante)
- [ ] Confirmar/ajustar si `GET /api/facturas` y `GET /api/financiero/resumen`
      excluyen `fee_plataforma` (§4)
