# Etapa 1: Build de la app Angular
FROM node:20 AS build

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# Etapa 2: Servir la app con nginx
FROM nginx:1.25-alpine

# Copia el build de Angular al directorio de nginx
COPY --from=build /app/dist/backoffice-app /usr/share/nginx/html

# Expone el puerto
EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
