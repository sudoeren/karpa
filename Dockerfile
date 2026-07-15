# Build stage
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=7250

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/out ./out
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 7250

CMD ["npx", "serve", "out", "-l", "7250", "--single", "--no-clipboard"]
