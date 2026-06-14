# Stage 1: Install production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./
COPY scripts/ ./scripts/
COPY src/ ./src/
COPY db/ ./db/

USER appuser

EXPOSE 5000

# tsx is a production dependency — handles path aliases and runs TS directly
CMD ["npm", "run", "start"]
