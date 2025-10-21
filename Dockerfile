FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración primero
COPY package*.json ./
COPY .nvmrc ./

# Instalar dependencias con build desde fuente para better-sqlite3
RUN npm install --build-from-source

# Copiar el resto del código
COPY . .

# Crear directorio para base de datos
RUN mkdir -p database

# Exponer puerto
EXPOSE 3000

# Variable de entorno
ENV NODE_ENV=production

# Iniciar aplicación
CMD ["npm", "start"]