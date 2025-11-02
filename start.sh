#!/bin/bash

# Navigate to the backend directory, install dependencies, and start the server
echo "Starting backend..."
cd backend
npm install
npm start &

# Navigate back to the root and serve the frontend
echo "Serving frontend..."
cd ..
npx serve -s frontend -l 3001
