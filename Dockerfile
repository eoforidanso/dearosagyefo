FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create data directory for database
RUN mkdir -p data

# Expose port (8080 for Google Cloud Run, 3000 for local)
EXPOSE 8080 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start application
CMD ["npm", "start"]
