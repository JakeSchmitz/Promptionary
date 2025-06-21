# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/frontend ./apps/frontend
RUN npm install --legacy-peer-deps
RUN cd apps/frontend && npm install --legacy-peer-deps && npm run build

# Stage 2: Production
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/apps/frontend/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 