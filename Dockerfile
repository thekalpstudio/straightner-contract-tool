# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .
EXPOSE 3000

# default to API. Use separate service for worker in compose
CMD ["node", "server/app.js"]
