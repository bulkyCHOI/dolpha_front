# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production optimization
RUN npm cache clean --force && \
    npm ci --only=production=false && \
    npm cache verify

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src

EXPOSE 3000

# Use npm start for development (change to serve for production if needed)
CMD ["npm", "start"]