FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar definición de dependencias primero (para aprovechar cache)
COPY app/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar el resto de la app
COPY app/. .

# La app escucha en el puerto 80 dentro del contenedor
EXPOSE 80

# Comando de arranque
CMD ["npm", "start"]
