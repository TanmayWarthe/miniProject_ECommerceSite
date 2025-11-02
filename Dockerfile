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

# Start the server
CMD ["npm", "start"]
