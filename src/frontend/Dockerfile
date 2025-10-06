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
RUN yarn build --mode production

# Stage 2: Production nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

