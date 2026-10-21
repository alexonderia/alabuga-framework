FROM node:24.19.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@11.17.0
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG CONSTRUCTOR_URL=http://127.0.0.1:4176
ENV VITE_CONSTRUCTOR_URL=$CONSTRUCTOR_URL CONSTRUCTOR_URL=$CONSTRUCTOR_URL
RUN npm run build:docs && npm run check:docs

FROM nginx:1.28.0-alpine
COPY --from=build /app/dist/docs /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
