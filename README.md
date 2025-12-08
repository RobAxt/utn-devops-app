# Aplicación Web de Logs con Node.js, Docker y MariaDB

## 1. Descripción general

Este proyecto implementa una aplicación web simple que permite:

- Visualizar una tabla de **eventos (logs) simulados** almacenados en una base de datos MariaDB.
- Insertar **nuevos eventos** desde un formulario web.
- Ejecutar toda la solución mediante **contenedores Docker** orquestados con **Docker Compose**.

La aplicación web está desarrollada en **Node.js** (usando Express y mysql2) y se conecta a una base de datos **MariaDB** que se ejecuta en un contenedor separado con almacenamiento persistente.

Este proyecto está pensado para ser utilizado dentro de una máquina virtual provisionada con **Vagrant**, donde:

1. Se instala Docker (y Docker Compose).
2. Se clona este repositorio desde Git.
3. Se construyen las imágenes y se levantan los contenedores con `docker compose`.


## 2. Arquitectura de la solución

La arquitectura lógica es la siguiente:

- **webapp**: contenedor que ejecuta la aplicación Node.js.
  - Se construye a partir de un `Dockerfile` propio.
  - Expone un servidor HTTP en el puerto 80 dentro del contenedor.
  - Se publica al host en el puerto 8080.
  - Monta el código fuente desde el host para facilitar el desarrollo.

- **mariadb**: contenedor con el motor de base de datos MariaDB.
  - Inicializa la base de datos `logsdb`.
  - Crea el usuario `logsuser` con contraseña `logspass`.
  - Ejecuta un script de inicialización `db_init.sql` que crea la tabla de logs e inserta datos simulados.
  - Almacena los datos de manera persistente utilizando un volumen Docker.

---

## 3. Estructura de archivos del proyecto

Estructura principal del repositorio:

```text
UTN-DevOps-App/
├── app/
│   ├── package.json
│   └── server.js
├── db/
│   └── db_init.sql
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### 3.1. Carpeta `app/`

Contiene la aplicación Node.js:

- **`package.json`**  
  Define el nombre del proyecto, dependencias y scripts de ejecución.  
  Las dependencias principales son:
  - `express`: framework web para Node.js.
  - `mysql2`: cliente para conectarse a MariaDB/MySQL con soporte de Promises.

  El script principal es:

  ```json
  "scripts": {
    "start": "node server.js"
  }
  ```

- **`server.js`**  
  Es el archivo principal de la aplicación Node.js.  
  Sus responsabilidades son:

  - Configurar la conexión a la base de datos usando variables de entorno:
    - `DB_HOST` (por defecto `mariadb`)
    - `DB_NAME` (por defecto `logsdb`)
    - `DB_USER` (por defecto `logsuser`)
    - `DB_PASS` (por defecto `logspass`)
  - Crear un pool de conexiones a MariaDB usando `mysql2/promise`.
  - Exponer dos rutas principales:
    - `GET /`: consulta los últimos 50 eventos de la tabla `event_logs` y genera una página HTML que:
      - Muestra un formulario para ingresar un nuevo evento.
      - Muestra la tabla con los eventos existentes.
    - `POST /add-event`: recibe los datos del formulario (nivel, origen y mensaje) e inserta un nuevo registro en la base de datos.

  La respuesta HTML se genera manualmente (sin plantillas externas), incluyendo estilos básicos y la tabla de eventos.

### 3.2. Carpeta `db/`

- **`db/db_init.sql`**  
  Script SQL que se ejecuta automáticamente la primera vez que se inicializa el contenedor de MariaDB (cuando el volumen de datos está vacío).  
  Sus tareas típicas son:

  - Crear la base de datos `logsdb` (si no existe).
  - Crear la tabla `event_logs`.
  - Insertar algunos eventos simulados para que la aplicación tenga datos iniciales que mostrar.

### 3.3. `Dockerfile`

Define cómo se construye la imagen del servicio `webapp` (aplicación Node.js):

```dockerfile
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar solo package.json / package-lock.json primero (para aprovechar cache de build)
COPY app/package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto de la app
COPY app/. .

# Puerto interno donde escucha la app
EXPOSE 80

# Comando de arranque
CMD ["npm", "start"]
```

Puntos importantes:

- Usa **Node.js 20 sobre Alpine Linux**, lo que hace que la imagen sea liviana.
- Se aprovecha la caché de Docker copiando primero `package*.json` y ejecutando `npm install`.  
  De esta forma, si el código cambia pero las dependencias no, el paso de instalación no se repite.
- Copia el código de la aplicación dentro de la imagen.
- Define el comando de arranque de la aplicación (`npm start`).

---

## 4. `docker-compose.yml`

Archivo que define y levanta los dos servicios: `webapp` y `mariadb`.

```yaml
services:

  webapp:
    build: .
    ports:
      - "8080:80"

  mariadb:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: rootpass
      MARIADB_DATABASE: logsdb
      MARIADB_USER: logsuser
      MARIADB_PASSWORD: logspass
    volumes:
      - ./db/db_init.sql:/docker-entrypoint-initdb.d/db_init.sql:ro
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

### 4.1. Servicio `webapp`

- **`build: .`**  
  Construye la imagen usando el `Dockerfile` del directorio actual.
- **`ports`**  
  Mapea el puerto 80 del contenedor al puerto 8080 del host:  
  La aplicación queda accesible en `http://localhost:8080`.

### 4.2. Servicio `mariadb`

- **`image: mariadb:11`**  
  Usa la imagen oficial de MariaDB, versión 11.
- **`environment`**
Define las variables de entorno para que la app Node.js se conecte a MariaDB.
- **`volumes`**  
  - `./db/db_init.sql:/docker-entrypoint-initdb.d/db_init.sql:ro`  
    Monta el script de inicialización en el directorio especial que MariaDB ejecuta al crear el datadir por primera vez.
  - `db_data:/var/lib/mysql`  
    Volumen nombrado que almacena de forma persistente los archivos de datos de la base de datos.  
    Esto asegura que los datos se conserven aunque se eliminen los contenedores.

- **`volumes: db_data`**  
  Declara el volumen persistente que utiliza el servicio `mariadb`.

---

## 5. Esquema de la base de datos

La base de datos utilizada se llama **`logsdb`** y contiene una tabla principal llamada **`event_logs`**, que almacena eventos simulados de un sistema.

Cada fila de la tabla representa un evento individual.

Los campos principales son:

| Campo        | Tipo      | Descripción                                              |
|--------------|-----------|----------------------------------------------------------|
| `id`         | INT       | Identificador único del evento (clave primaria).        |
| `event_time` | DATETIME  | Fecha y hora en que ocurrió el evento.                  |
| `level`      | VARCHAR   | Nivel del evento (`INFO`, `WARN`, `ERROR`).             |
| `source`     | VARCHAR   | Origen del evento (por ejemplo: `nginx`, `mariadb`, `app`). |
| `message`    | TEXT      | Mensaje descriptivo del evento.                         |

Los datos iniciales son **simulados** y se insertan automáticamente mediante el script `db_init.sql` la primera vez que se inicializa el contenedor de MariaDB.

La aplicación web:

- Consulta estos datos y los muestra en una tabla HTML.
- Permite agregar nuevos eventos mediante un formulario que envía datos a la ruta `POST /add-event`.

---

## 6. Comportamiento de la aplicación Node.js

La aplicación Node.js expone principalmente dos rutas HTTP:

### 6.1. `GET /`

- Consulta los últimos 50 registros de la tabla `event_logs`.
- Renderiza una página HTML que incluye:
  - Un formulario para insertar un nuevo evento.
    - Nivel (`INFO`, `WARN`, `ERROR`).
    - Origen (texto libre: por ejemplo `nginx`, `mariadb`, `scheduler`).
    - Mensaje (descripción del evento).
  - Una tabla con los eventos existentes (tanto los simulados como los ingresados por el usuario).

### 6.2. `POST /add-event`

- Recibe los datos enviados desde el formulario:
  - `level`
  - `source`
  - `message`
- Valida que todos los campos estén presentes.
- Inserta un nuevo registro en la tabla `event_logs` con:
  - `event_time = NOW()` (tiempo del servidor de base de datos).
  - `level`, `source`, `message` según lo ingresado por el usuario.
- Redirige nuevamente a `/` para mostrar el listado actualizado.

---

## 7. Puesta en marcha

### 7.1. Requisitos previos dentro de la máquina virtual

- Docker instalado.
- Docker Compose disponible (viene integrado como `docker compose` en versiones modernas de Docker).

### 7.2. Pasos típicos

1. Clonar el repositorio dentro de la VM:

   ```bash
   git clone git@github.com:RobAxt/utn-devops-app.git
   git checkout utn-ba-practica2
   cd utn-devops-app
   ```

2. Construir imágenes y levantar contenedores:

   ```bash
   docker compose up -d --build
   ```

3. Verificar que los servicios estén corriendo:

   ```bash
   docker compose ps
   ```

4. Acceder a la aplicación web:

   - Desde el navegador (dentro o fuera de la VM, según configuración de red):

     ```
     http://localhost:8080
     ```

   - O utilizando `curl`:

     ```bash
     curl http://localhost:8080
     ```

---

## 8. Persistencia de datos y reinicios

Gracias al volumen `db_data`, los datos almacenados en `logsdb` se conservan aunque:

- Se detengan los contenedores (`docker compose down`).
- Se vuelvan a crear los contenedores (`docker compose up`).

El script `db_init.sql` **solo se ejecuta la primera vez**, cuando el directorio de datos de MariaDB está vacío.  
Si se desea reinicializar completamente la base de datos (borrar todos los datos y recrear la estructura desde cero), es necesario eliminar también el volumen:

```bash
docker compose down -v
docker compose up -d --build
```

---


---

## 9. Pruebas unitarias

Para permitir la ejecución de pruebas unitarias sobre la aplicación Node.js se realizaron los siguientes cambios:

- **Se instaló Jest y Supertest** como dependencias de desarrollo en la carpeta `app/`.
- **Se creó el archivo `server.test.js`** con una prueba básica que verifica la respuesta HTTP de la ruta principal (`/`).
- **Se refactorizó `server.js`** para exportar la instancia de Express (`module.exports = app`) en vez de iniciar el servidor directamente. El arranque del servidor se movió a `start.js`.
- **El puerto por defecto del servidor se cambió a 8081** para evitar conflictos y problemas de permisos durante los tests.
- **La configuración de la base de datos se adaptó** para que, si la variable de entorno `NODE_ENV` es `test`, el host de la base de datos sea `localhost` en vez de `mariadb`. Esto permite que los tests accedan a MariaDB cuando se publica el puerto 3306 al host.
- **Se agregó la publicación del puerto 3306** en el servicio `mariadb` del `docker-compose.yml` para permitir la conexión desde el entorno de desarrollo y de pruebas.

### Ejecución de pruebas

Para ejecutar las pruebas unitarias:

```bash
NODE_ENV=test npm test --prefix app
```

Esto ejecuta Jest en modo test, conectando a la base de datos local si está disponible.

---
