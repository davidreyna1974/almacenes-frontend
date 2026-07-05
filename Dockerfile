# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build -- --configuration=production

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM nginx:alpine
# nginx.conf se coloca como PLANTILLA: el entrypoint del image la procesa con
# envsubst al arrancar y genera /etc/nginx/conf.d/default.conf.
# NGINX_ENVSUBST_FILTER=DOMAIN → envsubst solo sustituye ${DOMAIN} (la ruta del
# certificado); deja intactas las variables de nginx ($host, $uri, $scheme, ...).
# El VALOR de DOMAIN lo pasa docker-compose (ver 03-deploy.sh).
ENV NGINX_ENVSUBST_FILTER=DOMAIN
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist/almacenes/browser /usr/share/nginx/html
EXPOSE 80 443
