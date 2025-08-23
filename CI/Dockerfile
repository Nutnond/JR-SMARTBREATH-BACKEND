FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache bash

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
RUN chown -R app:app /app
USER app
CMD ["node", "server.js"]
