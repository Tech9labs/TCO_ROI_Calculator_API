FROM node:22-alpine

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

CMD ["npm", "start"]
