FROM node:18-alpine

# Install http-server globally
RUN npm install -g http-server

# Set working directory for the React app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the React app source
COPY . ./

# Build the React application
RUN npm run build

# Set the working directory to the build output
WORKDIR /app/build

# Expose port 8080 (http-server default)
EXPOSE 8080

# Start http-server
CMD ["http-server", "-p", "8080"]