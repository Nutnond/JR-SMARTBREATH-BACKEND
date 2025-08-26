# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache bash

# Stage 2: Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Final runner image
FROM node:20-alpine AS runner
WORKDIR /app

# ✅ 1. ติดตั้ง Chromium และ dependencies ที่จำเป็นสำหรับ Alpine
# เราจะไม่ใช้ "npx puppeteer browsers install chrome" บน Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    json-glib

# ✅ 2. (สำคัญ) ตั้งค่า Environment Variable เพื่อบอก Puppeteer ว่า Chromium อยู่ที่ไหน
# วิธีนี้จะป้องกันไม่ให้ Puppeteer พยายามดาวน์โหลดเบราว์เซอร์เอง
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# สร้าง user และ group สำหรับรันแอปพลิเคชัน
RUN addgroup -S app && adduser -S app -G app

# คัดลอกไฟล์ที่จำเป็นจาก stage ก่อนหน้า
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ตั้งค่า Environment และ Port
ENV NODE_ENV=production
EXPOSE 8080

# เปลี่ยนเจ้าของไฟล์และสลับไปใช้ user ที่สร้างขึ้น
RUN chown -R app:app /app
USER app

# สั่งรันแอปพลิเคชัน
CMD ["node", "server.js"]