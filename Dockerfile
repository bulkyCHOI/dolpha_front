FROM node:18-alpine

WORKDIR /app

# Copy package.json only (not package-lock.json to avoid sync issues)
COPY package.json ./

# Install all dependencies and generate new package-lock.json
RUN npm cache clean --force && \
    npm install --no-package-lock-check && \
    npm cache verify

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

# Use npm start for development server
CMD ["npm", "start"]