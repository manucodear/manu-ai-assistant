# Multi-stage Dockerfile for building the Vite + React + TypeScript app and serving with nginx

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (copy package files first for better caching)
# We use Yarn. Copy yarn.lock if present and enable corepack to ensure yarn is available.
COPY package.json yarn.lock* ./
RUN corepack enable && corepack prepare yarn@stable --activate \
	&& sh -c "if [ -f yarn.lock ]; then yarn install --frozen-lockfile --non-interactive --silent; else yarn install --non-interactive --silent; fi"

# Copy rest of the sources and build
COPY . .
RUN yarn build

# Production stage - nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with one that supports SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
