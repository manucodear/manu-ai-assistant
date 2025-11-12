# Multi-stage Dockerfile for building the Vite + React + TypeScript app and serving with nginx

# Stage 1: Build
FROM node:20-bullseye AS builder
WORKDIR /app

# Copy dependency manifests
COPY package.json yarn.lock* ./

# Install dependencies (verbose for debugging)
RUN yarn install --frozen-lockfile --verbose

# Copy source code and build
COPY . ./

# Allow SITE_URL to be provided at build time; default to the requested domain
ARG SITE_URL="https://ai.manucode.ar"
ENV SITE_URL=${SITE_URL}

# Debug: Show environment files and their contents and build (also generate sitemap/robots)
RUN echo "=== Debugging Environment Files ===" && \
    ls -la .env* || true && \
    echo "Contents of .env.production (if present):" && \
    (cat .env.production || echo "<no .env.production>") && \
    echo "=== Building (with SITE_URL=${SITE_URL}) ===" && \
    yarn build:production && \
    node ./scripts/generate-sitemap.cjs

# Stage 2: Production nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

