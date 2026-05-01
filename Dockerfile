# Etapa 1: Build de la app Angular
FROM node:20 AS build

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

# Etapa 2: Servir la app con nginx
FROM nginx:1.25-alpine

# Copia el build de Angular al directorio de nginx
COPY --from=build /app/dist/backoffice-app/browser /usr/share/nginx/html

# Ajusta Nginx para escuchar en el puerto 4200
RUN sed -i 's/listen       80;/listen       4200;/g' /etc/nginx/conf.d/default.conf

# Expone el puerto
EXPOSE 4200

CMD ["/bin/sh", "-c", "envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js && nginx -g 'daemon off;'"]
