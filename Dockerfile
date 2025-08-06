FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (React development server needs dev dependencies)
RUN npm cache clean --force && \
    npm ci && \
    npm cache verify

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

# Use npm start for development server
CMD ["npm", "start"]