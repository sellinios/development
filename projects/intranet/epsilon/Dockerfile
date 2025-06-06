# --------------------------------------
# 1) Base image to ensure same Node version
# --------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# --------------------------------------
# 2) Dependencies: copy package.json etc. only
# --------------------------------------
FROM base AS deps
WORKDIR /app

# Copy only the files needed for installing dependencies
COPY package*.json ./

# Copy your Next.js/TypeScript config files so that
# npm install can pick up any dependencies from them if needed
COPY tsconfig.json .
COPY next.config.ts .
COPY postcss.config.mjs .
COPY tailwind.config.ts .
# If you have next-env.d.ts in the root, copy that too
COPY next-env.d.ts .

# Install dependencies (clean install to ensure reproducible)
RUN npm ci

# --------------------------------------
# 3) Builder: copy the rest of the app and build
# --------------------------------------
FROM base AS builder
WORKDIR /app

# Copy everything from the deps stage (node_modules + config files)
COPY --from=deps /app /app

# Copy the rest of your source code
COPY . .

# Set environment for production build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Optional: Inspect what's in /app
RUN ls -la
RUN ls -la src/app/components

# Build Next.js
RUN npm run build

# --------------------------------------
# 4) Runner (final image)
# --------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the build artifacts, node_modules, etc.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.ts ./
# If you need your tsconfig.json at runtime for any reason, add:
# COPY --from=builder /app/tsconfig.json ./

# Expose and run
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
