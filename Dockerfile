# Customatic: docker build -t customatic . && docker run -p 3000:3000 -e BETTER_AUTH_SECRET=... -v customatic-data:/app/.data customatic
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app ./
RUN npm prune --omit=dev
EXPOSE 3000
# Applies database migrations, then starts the server. Without DATABASE_URL, data lives in /app/.data (mount a volume).
CMD ["npm", "start"]
