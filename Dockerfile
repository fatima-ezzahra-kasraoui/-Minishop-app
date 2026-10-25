FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    BUGS=off

WORKDIR /app

# Dépendances d'abord, pour profiter du cache de couches Docker.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "--disable-warning=ExperimentalWarning", "src/server.js"]
