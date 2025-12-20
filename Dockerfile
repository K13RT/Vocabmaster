# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the backend and serve the frontend
FROM node:20-alpine
WORKDIR /app

# Copy root package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend code
COPY server/ ./server/

# Copy built frontend from Stage 1 to the backend's static folder
# The backend index.js serves client/dist in production
COPY --from=frontend-builder /app/client/dist ./client/dist

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Command to run the application
CMD ["node", "server/index.js"]
