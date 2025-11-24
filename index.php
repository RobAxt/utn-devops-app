<?php
require_once __DIR__ . '/config.php';

// Traer logs desde la base de datos
try {
    $stmt = $pdo->prepare("
        SELECT id, event_time, level, source, message
        FROM event_logs
        ORDER BY event_time DESC
        LIMIT 50
    ");
    $stmt->execute();
    $logs = $stmt->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo "<h1>Error al consultar los logs</h1>";
    echo "<pre>" . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . "</pre>";
    exit;
}

function h($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title><?= h($pageTitle) ?></title>
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
    <h1>Visor de eventos de la práctica 2 Docker con WebApp + MariaDB</h1>
</header>
<main>
    <section class="card">
        <div class="card-header">
            <h2>Eventos recientes</h2>
            <span>Fuente: tabla <code>logsdb.event_logs</code> (datos simulados)</span>
        </div>

        <?php if (empty($logs)): ?>
            <p>No hay eventos registrados en la base de datos.</p>
        <?php else: ?>
            <table>
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
                <?php foreach ($logs as $log): ?>
                    <tr>
                        <td><?= h($log['id']) ?></td>
                        <td><?= h($log['event_time']) ?></td>
                        <td>
                            <?php
                                $lvl = strtoupper($log['level']);
                                $lvlClass = 'level-' . $lvl;
                            ?>
                            <span class="level <?= h($lvlClass) ?>"><?= h($lvl) ?></span>
                        </td>
                        <td><?= h($log['source']) ?></td>
                        <td><?= nl2br(h($log['message'])) ?></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <div class="footer">
            Práctica 2 - Vagrant + Docker + Nginx con PHP + MariaDB.
        </div>
    </section>
</main>
</body>
</html>
