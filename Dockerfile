# -------- deps (installs dev + prod) --------
    FROM node:20-alpine AS deps
    WORKDIR /app
    COPY package.json yarn.lock ./
    RUN yarn install --frozen-lockfile
    
    # -------- builder --------
    FROM node:20-alpine AS builder
    WORKDIR /app
    ENV NEXT_TELEMETRY_DISABLED=1
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN yarn build
    
    # -------- runner (tiny) --------
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    ENV PORT=3000
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # non-root user
    RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
    
    # copy standalone output
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    
    USER nextjs
    EXPOSE 3000
    CMD ["node", "server.js"]
    