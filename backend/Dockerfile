FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install --production

# Copy source
COPY . .

# Install netcat to wait for MySQL to be ready
RUN apk add --no-cache netcat-openbsd

EXPOSE 3000

# Wait for the database to be ready, initialize DB, then start the app
CMD ["sh", "-c", "until nc -z db 3306; do echo 'Waiting for MySQL...'; sleep 2; done; npm run init-db && npm start"]
