## Descripción de los datos almacenados en la base de datos

La base de datos contiene una tabla llamada **event_logs** que almacena eventos simulados del sistema, como si fueran logs reales de una aplicación o servidor.
Cada fila representa un evento individual.

Los campos que se consumen desde la aplicación web son:

| Campo       | Tipo      | Descripción                                              |
|-------------|-----------|----------------------------------------------------------|
| **id**         | INT       | Identificador único del evento.                         |
| **event_time** | DATETIME  | Fecha y hora en que ocurrió el evento.                  |
| **level**      | VARCHAR   | Nivel del evento (`INFO`, `WARN`, `ERROR`).             |
| **source**     | VARCHAR   | Origen del evento (ejemplo: *nginx*, *mariadb*, *scheduler*). |
| **message**    | TEXT      | Mensaje descriptivo del evento.                         |

Estos datos son simulados y se insertan automáticamente mediante el archivo **db_init.sql** la primera vez que el contenedor de MariaDB se inicializa.

La aplicación web lee esta información y la muestra en una tabla HTML, permitiendo visualizar fácilmente el estado simulado del sistema.

