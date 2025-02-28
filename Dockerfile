# Stage 1: Build the React app
FROM node:16 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ARG KEYCLOAK_URL
ARG KEYCLOAK_CLIENT_ID
ARG KEYCLOAK_CLIENT_SECRET

RUN REACT_APP_KEYCLOAK_URL=$KEYCLOAK_URL \
    REACT_APP_KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID \
    npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
# Copy the entire build directory, preserving the structure
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]