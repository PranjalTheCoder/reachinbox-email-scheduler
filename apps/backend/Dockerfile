# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY prisma ./prisma
# RUN npx prisma generate
# COPY . .
# RUN npm run build
# EXPOSE 5000
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install   # <--- Change this line
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]