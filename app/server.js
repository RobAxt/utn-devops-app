const express = require('express');
const mysql = require('mysql2/promise');

const app = express();

// Middleware para parsear datos de formularios HTML (POST)
app.use(express.urlencoded({ extended: true }));

// Config de DB (coinciden con docker-compose)
const DB_HOST = process.env.NODE_ENV === 'test' ? 'localhost' : (process.env.DB_HOST || 'mariadb');
const DB_NAME = process.env.DB_NAME || 'logsdb';
const DB_USER = process.env.DB_USER || 'logsuser';
const DB_PASS = process.env.DB_PASS || 'logspass';

const PORT = process.env.PORT || 80;

// Pool de conexiones a MariaDB
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para escapar HTML
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render de la página completa
function renderPage(title, logs, formError = null) {
  const rowsHtml = logs
    .map((log) => {
      const lvl = String(log.level || '').toUpperCase();
      const lvlClass = `level-${lvl}`;
      return `
        <tr>
          <td>${esc(log.id)}</td>
          <td>${esc(log.event_time)}</td>
          <td>
            <span class="level ${esc(lvlClass)}">${esc(lvl)}</span>
          </td>
          <td>${esc(log.source)}</td>
          <td>${esc(log.message)}</td>
        </tr>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      margin: 0;
      padding: 0;
    }
    header {
      background: #111827;
      padding: 1rem 2rem;
      border-bottom: 1px solid #1f2937;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    main {
      padding: 1.5rem 2rem 3rem;
    }
    .card {
      background: #020617;
      border-radius: 0.75rem;
      padding: 1rem 1.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      border: 1px solid #111827;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.75rem;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .card-header span {
      font-size: 0.9rem;
      color: #9ca3af;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }
    thead {
      background: #111827;
    }
    th, td {
      padding: 0.5rem 0.6rem;
      text-align: left;
      border-bottom: 1px solid #1f2937;
      vertical-align: top;
    }
    tbody tr:nth-child(odd) {
      background: #020617;
    }
    tbody tr:nth-child(even) {
      background: #030712;
    }
    .level {
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      display: inline-block;
    }
    .level-INFO {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }
    .level-WARN {
      background: rgba(234, 179, 8, 0.1);
      color: #eab308;
    }
    .level-ERROR {
      background: rgba(248, 113, 113, 0.1);
      color: #f87171;
    }
    .footer {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #6b7280;
    }
    .form-group {
      margin-bottom: 0.75rem;
    }
    .form-group label {
      display: block;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.4rem 0.6rem;
      border-radius: 0.5rem;
      border: 1px solid #374151;
      background: #020617;
      color: #e5e7eb;
      font-size: 0.9rem;
    }
    .form-actions {
      margin-top: 0.5rem;
      text-align: right;
    }
    .btn {
      padding: 0.45rem 0.9rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-primary {
      background: #22c55e;
      color: #020617;
    }
    .btn-primary:hover {
      filter: brightness(1.1);
    }
    .error {
      color: #f87171;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    @media (max-width: 768px) {
      main {
        padding: 1rem;
      }
      header {
        padding: 0.75rem 1rem;
      }
      table {
        font-size: 0.8rem;
      }
      th, td {
        padding: 0.4rem;
      }
    }
  </style>
</head>
<body>
<header>
  <h1>${esc(title)}</h1>
</header>
<main>

  <section class="card">
    <div class="card-header">
      <h2>Nuevo evento</h2>
      <span>Inserta un nuevo registro en <code>event_logs</code></span>
    </div>

    ${
      formError
        ? `<div class="error">${esc(formError)}</div>`
        : ''
    }

    <form method="POST" action="/add-event">
      <div class="form-group">
        <label for="level">Nivel</label>
        <select id="level" name="level" required>
          <option value="">-- Selecciona un nivel --</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
      </div>
      <div class="form-group">
        <label for="source">Origen</label>
        <input type="text" id="source" name="source" placeholder="node, mariadb, app, scheduler..." required />
      </div>
      <div class="form-group">
        <label for="message">Mensaje</label>
        <textarea id="message" name="message" rows="3" placeholder="Descripción del evento" required></textarea>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Guardar evento</button>
      </div>
    </form>
  </section>

  <section class="card">
    <div class="card-header">
      <h2>Eventos recientes</h2>
      <span>Fuente: tabla <code>logsdb.event_logs</code> (datos simulados + ingresados)</span>
    </div>

    ${
      logs.length === 0
        ? '<p>No hay eventos registrados en la base de datos.</p>'
        : `<table>
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha / Hora</th>
            <th>Nivel</th>
            <th>Origen</th>
            <th>Mensaje</th>
          </tr>
        </thead>
        <tbody>
        ${rowsHtml}
        </tbody>
      </table>`
    }

    <div class="footer">
      Página generada para la práctica de Docker + MariaDB con Node.js.
    </div>
  </section>

</main>
</body>
</html>`;
}

// GET / → lista eventos + formulario
app.get('/', async (req, res) => {
  const title = 'Visor de eventos de la práctica Docker + MariaDB (Node.js)';

  try {
    const [rows] = await pool.query(
      `SELECT id, event_time, level, source, message
       FROM event_logs
       ORDER BY event_time DESC
       LIMIT 50`
    );
    res.status(200).send(renderPage(title, rows));
  } catch (err) {
    console.error('Error al consultar los logs:', err);
    res
      .status(500)
      .send('<h1>Error al consultar los logs</h1><pre>' + String(err) + '</pre>');
  }
});

// POST /add-event → inserta un nuevo registro en event_logs
app.post('/add-event', async (req, res) => {
  const { level, source, message } = req.body || {};

  // Validación mínima
  if (!level || !source || !message) {
    try {
      const [rows] = await pool.query(
        `SELECT id, event_time, level, source, message
         FROM event_logs
         ORDER BY event_time DESC
         LIMIT 50`
      );
      const title = 'Visor de eventos de la práctica Docker + MariaDB (Node.js)';
      return res
        .status(400)
        .send(renderPage(title, rows, 'Todos los campos son obligatorios.'));
    } catch (err) {
      console.error('Error al consultar los logs:', err);
      return res
        .status(500)
        .send('<h1>Error al consultar los logs</h1><pre>' + String(err) + '</pre>');
    }
  }

  try {
    // event_time se completa con NOW() directamente en SQL
    await pool.query(
      `INSERT INTO event_logs (event_time, level, source, message)
       VALUES (NOW(), ?, ?, ?)`,
      [level, source, message]
    );
    // Redirigir a la página principal para ver el nuevo evento
    res.redirect('/');
  } catch (err) {
    console.error('Error al insertar el evento:', err);
    res
      .status(500)
      .send('<h1>Error al insertar el evento</h1><pre>' + String(err) + '</pre>');
  }
});

module.exports = { app, pool };
