FROM nginx:alpine

# Install Node.js and npm for building the React app
RUN apk add --no-cache nodejs npm

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

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Move the built React app to Nginx's serving directory
RUN mv /app/build /usr/share/nginx/html

# Clean up Node.js and npm to reduce image size (optional, but recommended)
RUN apk del nodejs npm

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]