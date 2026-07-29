FROM node:20-alpine

# تثبيت أدوات بناء sqlite3 (ضرورية جداً للعمل على الألباين)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --production --no-cache

COPY . .

RUN mkdir -p /data

EXPOSE ${PORT:-8080}

CMD ["node", "server.js"]
