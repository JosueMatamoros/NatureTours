# Avisos de reservas por WhatsApp

Cada reserva **nueva** (web directa, GetYourGuide, Viator) y cada **cancelación**
de OTA manda un mensaje desde el WhatsApp del negocio a los números de
`WHATSAPP_NOTIFY_TO`. Usa la API oficial con **coexistencia**: el número del
negocio se sigue usando normal en la app WhatsApp Business y los avisos quedan
en su historial.

Código: `utils/whatsapp.js` (se llama desde `ota.controller.js` y
`payments.controller.js`). Sin configuración no hace nada.

## 1. Conectar el número del negocio (YCloud, coexistencia)

1. Actualizá la app **WhatsApp Business** del negocio (versión 2.24.17 o más).
2. Creá cuenta en <https://www.ycloud.com> (plan gratis).
3. En YCloud: *WhatsApp → Connect / Add account* → elegí la opción de
   **conectar un número existente de la app WhatsApp Business (Coexistence)**.
4. Iniciá sesión con Facebook, creá o elegí el portafolio comercial (Meta
   Business) y seguí el asistente; al final te muestra un QR / aviso en la app
   WhatsApp Business del teléfono → aceptá.
5. Agregá un método de pago en YCloud (Meta cobra ~US$0.011 por mensaje).

## 2. Crear la plantilla

En YCloud: *WhatsApp → Templates → Create*.

- **Nombre:** `aviso_reserva`
- **Categoría:** Utility
- **Idioma:** Spanish (`es`)
- **Cuerpo** (copiar tal cual; ninguna variable puede quedar al inicio ni al
  final, y Meta rechaza plantillas con muchas variables para poco texto):

```
Hola, hay una novedad en las reservas de Nature Tours.

{{1}} reservó para el {{2}} a las {{3}}, son {{4}}.
Booking ID: {{5}}

{{6}}

Este es un aviso automático del sistema de reservas.
```

- **Ejemplos:** `Juan Segura` · `domingo 4 de octubre` · `08:00` ·
  `2 adultos` · `BR-1453233169` · `Reserva de Viator, ya viene pagada.`

Esperá a que quede **Approved**.

## 3. Variables en Render (backend)

| Variable | Valor |
|---|---|
| `WHATSAPP_PROVIDER` | `ycloud` |
| `WHATSAPP_API_KEY` | API key de YCloud (*Developers → API Keys*) |
| `WHATSAPP_FROM` | número del negocio en formato `+506XXXXXXXX` |
| `WHATSAPP_NOTIFY_TO` | números que reciben avisos, separados por coma: `+506XXXXXXXX,+506YYYYYYYY` |
| `WHATSAPP_TEMPLATE` | `aviso_reserva` (opcional, es el default) |
| `WHATSAPP_TEMPLATE_LANG` | `es` (opcional, es el default) |

Con Meta directo (sin YCloud): `WHATSAPP_PROVIDER=meta`,
`WHATSAPP_API_KEY=<access token>`, `WHATSAPP_PHONE_NUMBER_ID=<id>`.

## 4. Probar

```bash
node scripts/whatsapp-test.mjs BR-1453233169          # muestra el mensaje
node scripts/whatsapp-test.mjs BR-1453233169 --send   # lo envía de verdad
```

Notas:
- Abrí la app WhatsApp Business del negocio al menos cada ~14 días o la
  coexistencia se desconecta.
- Solo el primer pago de una reserva web avisa (el pago del saldo no).
- Cancelaciones hechas a mano desde el admin no avisan.
