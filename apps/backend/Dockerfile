# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/backend ./apps/backend
RUN npm install --legacy-peer-deps
RUN cd apps/backend && npm install --legacy-peer-deps && npm run build

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/example.env ./example.env
EXPOSE 3000
CMD ["node", "dist/server.js"] 