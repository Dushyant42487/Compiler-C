# ==============================================================
# Multi-Stage Dockerfile for C Compiler Web Application
# ==============================================================

# Stage 1: Build the C Compiler binary
FROM gcc:13-bookworm AS compiler-builder
WORKDIR /app
RUN apt-get update && apt-get install -y flex bison make && rm -rf /var/lib/apt/lists/*
COPY Makefile .
COPY compiler/ compiler/
COPY cli/ cli/
RUN make

# Stage 2: Build the Frontend assets
FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 3: Build the Backend TypeScript
FROM node:20-bookworm-slim AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 4: Production Runner Container
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install minimal host GCC for program execution mode (-r)
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5001
ENV COMPILER_BIN=/app/ccompiler

# Copy built compiler binary
COPY --from=compiler-builder /app/ccompiler /app/ccompiler
RUN chmod +x /app/ccompiler

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend dependencies and build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=backend-builder /app/backend/dist ./dist

# Create unprivileged user for security
RUN useradd -m -u 1001 compileruser && chown -R compileruser:compileruser /app
USER compileruser

EXPOSE 5001

CMD ["node", "dist/server.js"]
