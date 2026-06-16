FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src/
COPY prisma ./prisma/

RUN npx prisma generate \
    && npm run build \
    && mkdir -p dist/generated \
    && cp -r src/generated/prisma dist/generated/prisma

COPY public ./public/

EXPOSE 3000

CMD ["node", "dist/index.js"]
