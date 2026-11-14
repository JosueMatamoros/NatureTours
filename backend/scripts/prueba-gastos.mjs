// Uso: node scripts/prueba-gastos.mjs  (crea y borra el esquema gastos_prueba)
// Prueba de punta a punta del módulo gastos en un esquema aparte (se borra al final).
process.env.GASTOS_SCHEMA = 'gastos_prueba';
process.env.GASTOS_INGEST_TOKEN = 'prueba-token-de-ingesta-1234567890';
const express = (await import('express')).default;
const { pool } = await import('../db.js');
const { migrarGastos, S } = await import('../gastos/esquema.js');
const { hashCodigo } = await import('../gastos/auth.js');
const rutas = (await import('../gastos/routes.js')).default;
await pool.query(`DROP SCHEMA IF EXISTS gastos_prueba CASCADE`);
await migrarGastos();
await pool.query(`INSERT INTO ${S}.usuarios (nombre, correo, lee_correo, activacion_hash, activacion_expira) VALUES ('Josué','josue@test.com',true,$1, now()+interval '1 day'), ('Mario Andrés',null,false,$2, now()+interval '1 day')`, [hashCodigo('AAAA1111'), hashCodigo('BBBB2222')]);
const app = express(); app.use(express.json()); app.use('/api/gastos', rutas);
const srv = app.listen(4799);
const B = 'http://localhost:4799/api/gastos';
const call = async (m, p, body, tok, extra = {}) => { const r = await fetch(B + p, { method: m, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}), ...extra }, body: body ? JSON.stringify(body) : undefined }); const d = await r.json(); return { st: r.status, ...d }; };
const ok = (c, msg) => console.log((c ? '✅ ' : '❌ ') + msg);
try {
  let r = await call('POST', '/activar', { codigo: 'aaaa1111', cedula: '1-2345-6789', password: 'clave-secreta' });
  ok(r.ok && r.token && r.personal.categorias.length === 9, 'Josué activa su cuenta (9 categorías)');
  const J = r.token;
  ok((await call('POST', '/activar', { codigo: 'AAAA1111', cedula: '123456789', password: 'otra-clave' })).st === 401, 'el código no se puede reusar');
  r = await call('POST', '/activar', { codigo: 'BBBB2222', cedula: '987654321', password: 'clave-mario' });
  const M = r.token; ok(r.ok, 'Mario Andrés activa su cuenta');
  ok((await call('POST', '/login', { cedula: '123456789', password: 'mala' })).st === 401, 'contraseña mala → 401');
  r = await call('POST', '/login', { cedula: '1-2345-6789', password: 'clave-secreta' }); ok(r.ok, 'login de Josué');
  ok((await call('GET', '/datos')).st === 401, 'sin token → 401');
  // Ingesta
  const gastos = [
    { ref: 'BAC-1', fecha: '2026-11-03T12:00:00-06:00', banco: 'BAC', tipo: 'Tarjeta', comercio: 'AUTOMERCADO ESCAZU', textoCategoria: 'AUTOMERCADO ESCAZU', monto: 25000 },
    { ref: 'SINPE-9', fecha: '2026-11-04T09:00:00-06:00', banco: 'Popular', tipo: 'SINPE', comercio: 'SINPE · Heno caballos', textoCategoria: 'Heno caballos', monto: 40000 },
    { ref: 'BCR-5', fecha: '2026-11-05T15:00:00-06:00', banco: 'BCR', tipo: 'Tarjeta', comercio: 'SHEIN', textoCategoria: 'SHEIN', monto: 18400 },
  ];
  ok((await call('POST', '/ingesta', { correo: 'josue@test.com', gastos }, null, { 'x-gastos-token': 'malo' })).st === 401, 'ingesta con token malo → 401');
  r = await call('POST', '/ingesta', { correo: 'josue@test.com', gastos, avisar: false }, null, { 'x-gastos-token': process.env.GASTOS_INGEST_TOKEN });
  ok(r.nuevos === 3, 'ingesta: 3 nuevos');
  r = await call('POST', '/ingesta', { correo: 'josue@test.com', gastos, avisar: false }, null, { 'x-gastos-token': process.env.GASTOS_INGEST_TOKEN });
  ok(r.nuevos === 0, 'ingesta repetida: 0 (sin duplicados)');
  let d = await call('GET', '/datos', null, J);
  const auto = d.personal.movimientos.find((m) => m.comercio.startsWith('AUTO'));
  ok(auto.categoria === 'Supermercado', 'Automercado → Supermercado automático');
  const shein = d.personal.movimientos.find((m) => m.comercio === 'SHEIN');
  ok(shein.categoria === '', 'Shein queda por clasificar');
  // Categoría nueva + clasificar
  r = await call('POST', '/categorias', { nombre: 'Ropa', icono: 'Shirt', color: '#d98cb3' }, J);
  const ropa = r.personal.categorias.find((c) => c.nombre === 'Ropa'); ok(ropa, 'crear categoría Ropa');
  ok((await call('POST', '/categorias', { nombre: 'ropa', icono: 'Shirt', color: '#D98CB3' }, J)).st === 400, 'no deja duplicar nombre');
  r = await call('PATCH', `/movimientos/${shein.id}/categoria`, { categoriaId: ropa.id }, J); ok(r.actualizados === 1, 'Shein → Ropa');
  await call('POST', '/ingesta', { correo: 'josue@test.com', gastos: [{ ref: 'BCR-6', fecha: '2026-11-06T10:00:00-06:00', comercio: 'SHEIN', textoCategoria: 'SHEIN', monto: 9000 }], avisar: false }, null, { 'x-gastos-token': process.env.GASTOS_INGEST_TOKEN });
  d = await call('GET', '/datos', null, J);
  ok(d.personal.movimientos.filter((m) => m.comercio === 'SHEIN').every((m) => m.categoria === 'Ropa'), 'regla aprendida: el siguiente Shein cae solo en Ropa');
  ok((await call('PATCH', `/movimientos/${shein.id}/categoria`, { categoriaId: ropa.id }, M)).st === 403, 'Mario no puede tocar gastos personales de Josué');
  // Grupo
  const mario = d.usuarios.find((u) => u.nombre === 'Mario Andrés');
  r = await call('POST', '/grupos', { nombre: 'Tour a caballo', icono: 'Users', color: '#8FB573', miembros: [mario.id] }, J);
  const g = r.grupos[0]; ok(g && g.miembros.length === 2 && g.categorias.length === 5, 'grupo Tour a caballo con 2 miembros');
  const heno = d.personal.movimientos.find((m) => m.comercio.includes('Heno'));
  r = await call('POST', `/movimientos/${heno.id}/mover`, { grupoId: g.id }, J);
  ok(!r.personal.movimientos.some((m) => m.id === heno.id) && r.grupos[0].movimientos.some((m) => m.id === heno.id), 'mover SINPE de Josué al grupo (sale de personal)');
  r = await call('POST', '/movimientos', { grupoId: g.id, comercio: 'Herraduras', monto: 15000, categoriaId: g.categorias[2].id }, M);
  ok(r.ok && r.grupos[0].movimientos.length === 2, 'Mario agrega un gasto manual al grupo');
  const dm = await call('GET', '/datos', null, M);
  ok(dm.grupos[0].movimientos.length === 2 && dm.personal.movimientos.length === 0, 'Mario ve el grupo, no los gastos personales de Josué');
  ok((await call('POST', `/movimientos/${heno.id}/mover`, { grupoId: null }, M)).st === 403, 'solo quien pagó puede sacar su gasto del grupo');
  // Eliminar / restaurar
  r = await call('DELETE', `/movimientos/${auto.id}`, null, J); ok(!r.personal.movimientos.some((m) => m.id === auto.id), 'eliminar gasto');
  await call('POST', '/ingesta', { correo: 'josue@test.com', gastos, avisar: false }, null, { 'x-gastos-token': process.env.GASTOS_INGEST_TOKEN });
  d = await call('GET', '/datos', null, J); ok(!d.personal.movimientos.some((m) => m.id === auto.id), 'el correo no lo vuelve a agregar');
  r = await call('POST', `/movimientos/${auto.id}/restaurar`, null, J); ok(r.personal.movimientos.some((m) => m.id === auto.id), 'deshacer eliminar');
  // Borrar categoría
  r = await call('DELETE', `/categorias/${ropa.id}`, null, J); ok(r.movidos === 2 && r.personal.movimientos.filter((m) => m.comercio === 'SHEIN').every((m) => m.categoria === ''), 'borrar Ropa → sus 2 gastos quedan por clasificar');
  // Guías por tour (lee public.slot_guides sin modificarlo)
  const slot = (await pool.query(`SELECT id, to_char(tour_date,'YYYY-MM') mes FROM public.slot_guides WHERE tour_date >= '2026-11-01' ORDER BY tour_date LIMIT 1`)).rows[0];
  if (slot) {
    const antes = (await pool.query('SELECT count(*)::int n FROM public.slot_guides')).rows[0].n;
    ok((await call('GET', `/grupos/${g.id}/guias?mes=${slot.mes}`, null, J)).st === 404, 'grupo sin pagos de guías → 404');
    await pool.query(`UPDATE ${S}.grupos SET pagos_guias = true WHERE id = $1`, [g.id]);
    await call('POST', '/categorias', { grupoId: g.id, nombre: 'Guías', icono: 'Compass', color: '#8FB573' }, J);
    r = await call('GET', `/grupos/${g.id}/guias?mes=${slot.mes}`, null, M);
    const fila = r.guias.find((x) => x.id === slot.id);
    ok(fila && !fila.pagadoPor && r.precio === 10000, 'Mario ve los guías del mes, pendientes');
    r = await call('PUT', `/grupos/${g.id}/guias/${slot.id}`, { pagadoPor: mario.id, mes: slot.mes }, J);
    let mov = r.grupos[0].movimientos.find((m) => m.comercio.startsWith('Guía '));
    ok(r.guias.find((x) => x.id === slot.id).pagadoPor === mario.id && mov?.monto === 10000 && mov.categoria === 'Guías' && mov.quien === 'Mario Andrés', 'Josué marca que Mario pagó → gasto ₡10.000 en Guías a nombre de Mario');
    r = await call('PUT', `/grupos/${g.id}/guias/${slot.id}`, { pagadoPor: r.usuario.id, mes: slot.mes }, J);
    ok(r.grupos[0].movimientos.filter((m) => m.comercio.startsWith('Guía ')).length === 1 && r.grupos[0].movimientos.find((m) => m.comercio.startsWith('Guía ')).quien === 'Josué', 'cambiar a Josué no duplica el gasto');
    mov = r.grupos[0].movimientos.find((m) => m.comercio.startsWith('Guía '));
    await call('DELETE', `/movimientos/${mov.id}`, null, M);
    r = await call('GET', `/grupos/${g.id}/guias?mes=${slot.mes}`, null, J);
    ok(!r.guias.find((x) => x.id === slot.id).pagadoPor, 'si se elimina el gasto, el guía vuelve a pendiente');
    r = await call('PUT', `/grupos/${g.id}/guias/${slot.id}`, { pagadoPor: mario.id, mes: slot.mes }, M);
    ok(r.grupos[0].movimientos.filter((m) => m.comercio.startsWith('Guía ')).length === 1, 'volver a marcarlo funciona');
    r = await call('PUT', `/grupos/${g.id}/guias/${slot.id}`, { pagadoPor: null, noAplica: true, mes: slot.mes }, M);
    ok(r.guias.find((x) => x.id === slot.id).noAplica && !r.grupos[0].movimientos.some((m) => m.comercio.startsWith('Guía ')), '"no aplica" quita el gasto');
    r = await call('GET', `/grupos/${g.id}/guias`, null, J);
    ok(!r.guias.some((x) => x.id === slot.id) && r.guias.every((x) => !x.pagadoPor && !x.noAplica), 'pendientes: no incluye los ya resueltos');
    r = await call('PUT', `/grupos/${g.id}/guias/${slot.id}`, { pagadoPor: mario.id }, J);
    mov = r.grupos[0].movimientos.find((m) => m.comercio.startsWith('Guía '));
    ok(!r.guias.some((x) => x.id === slot.id), 'al pagar sale de la lista de pendientes');
    r = await call('PATCH', `/movimientos/${mov.id}`, { comercio: 'Guía Andy (medio día)', monto: 12500 }, M);
    ok(r.grupos[0].movimientos.some((m) => m.id === mov.id && m.monto === 12500 && m.comercio === 'Guía Andy (medio día)'), 'editar monto y descripción del pago');
    ok((await call('PATCH', `/movimientos/${auto.id}`, { comercio: 'x', monto: 1 }, J)).st === 400, 'gastos del banco no se editan');
    r = await call('PATCH', `/movimientos/${mov.id}`, { pagadoPor: d.usuario.id }, M);
    ok(r.grupos[0].movimientos.find((m) => m.id === mov.id)?.quien === 'Josué', 'cambiar quién pagó el guía');
    ok((await call('PATCH', `/movimientos/${mov.id}`, { pagadoPor: '00000000-0000-4000-8000-000000000000' }, M)).st === 400, 'no deja poner a alguien fuera del grupo');
    ok((await pool.query('SELECT count(*)::int n FROM public.slot_guides')).rows[0].n === antes, 'la asignación de guías del negocio no cambia');
  } else ok(true, '(sin guías asignados desde noviembre: se salta la prueba de guías)');
  // Token de gastos no sirve como admin del negocio
  const jwt = (await import('jsonwebtoken')).default;
  let adminOk = true; try { jwt.verify(J, process.env.JWT_SECRET); } catch { adminOk = false; }
  ok(!adminOk, 'el token de Mis Gastos NO es válido para el panel admin del negocio');
} finally {
  srv.close(); await pool.query(`DROP SCHEMA IF EXISTS gastos_prueba CASCADE`); await pool.end();
}
