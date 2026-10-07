# syntax=docker/dockerfile:1
FROM node:24.19.0-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/framework/package.json packages/framework/package.json
COPY packages/ai/package.json packages/ai/package.json
COPY apps/editor/package.json apps/editor/package.json
COPY apps/ai-server/package.json apps/ai-server/package.json
COPY apps/docs/package.json apps/docs/package.json
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM dependencies AS build
COPY . .
RUN npm run build

FROM nginx:1.28.0-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/site /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:8080/demo/ || exit 1

FROM node:24.19.0-bookworm-slim AS api
WORKDIR /app
COPY --from=build /app/apps/ai-server/dist ./
RUN mkdir /state && chown node:node /state
USER node
ENV AF_AI_HOST=0.0.0.0 AF_AI_PORT=4176 AF_AI_STATE_DIR=/state AF_AI_ARTIFACT_DIR=/state AF_AI_ENFORCE_LOCK=1
EXPOSE 4176
HEALTHCHECK --interval=15s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4176/api/ai/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "ai-server.js"]
