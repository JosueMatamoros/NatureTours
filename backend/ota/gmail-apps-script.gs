/**
 * NatureTours — Ingesta de reservas OTA (GetYourGuide / Viator) a la BD.
 *
 * Cómo usarlo:
 *  1. Entrá a https://script.google.com  (con la cuenta naturetourslafortuna@gmail.com).
 *  2. Nuevo proyecto → pegá este código.
 *  3. Cambiá BACKEND_URL por la URL real del backend en Render y TOKEN por el
 *     valor de OTA_INGEST_TOKEN (el mismo que está en el backend).
 *  4. Ejecutá `procesarOTA` una vez (autorizá los permisos de Gmail).
 *  5. Disparadores (reloj) → agregá un trigger de tiempo: `procesarOTA` cada 5 min.
 *
 * Marca los correos ya enviados con la etiqueta "OTA-Procesado" para no repetir.
 */

var BACKEND_URL = "https://TU-BACKEND.onrender.com/api/ota/inbound";
var TOKEN = "PEGAR_OTA_INGEST_TOKEN_AQUI";
var LABEL = "OTA-Procesado";

function procesarOTA() {
  var label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);

  // Remitentes de reservas y cancelaciones de GYG/Viator, sin procesar, últimos 7 días.
  var query =
    "(from:notification.getyourguide.com OR from:t1.viator.com OR from:chargebacks@viator.com) " +
    "-label:" + LABEL + " newer_than:7d";

  var threads = GmailApp.search(query, 0, 30);

  threads.forEach(function (thread) {
    var msgs = thread.getMessages();
    var okAll = true;

    msgs.forEach(function (msg) {
      var payload = {
        from: msg.getFrom(),
        subject: msg.getSubject(),
        body: msg.getPlainBody(),
      };
      try {
        var resp = UrlFetchApp.fetch(BACKEND_URL, {
          method: "post",
          contentType: "application/json",
          headers: { "x-ota-token": TOKEN },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
        });
        if (resp.getResponseCode() >= 300) {
          okAll = false;
          Logger.log("Error %s: %s", resp.getResponseCode(), resp.getContentText());
        } else {
          Logger.log("OK: %s → %s", msg.getSubject(), resp.getContentText());
        }
      } catch (e) {
        okAll = false;
        Logger.log("Fetch error: " + e);
      }
    });

    // Solo marcamos como procesado si TODO el thread se envió bien.
    if (okAll) thread.addLabel(label);
  });
}
