FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production

COPY backend/. ./

# Copy frontend files into the public directory of the backend
COPY frontend/ ./public/

# Expose the port
EXPOSE 3000

# Run init-db and start the server
CMD ["sh", "-c", "echo '--- ENV VARS ---' && printenv && echo '--- END ENV VARS ---' && npm run init-db && npm start"]
