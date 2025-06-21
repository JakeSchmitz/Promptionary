# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY apps/frontend/ .
COPY apps/shared/ ./shared/
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 