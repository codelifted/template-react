# Stage 1: Build the React app
FROM node:16 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
ARG COGNITO_CLIENT_ID
ARG COGNITO_IDP_URL
ARG COGNITO_USER_POOL_ID
ARG COGNITO_REGION

RUN REACT_APP_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID \
    REACT_APP_COGNITO_IDP_URL=$COGNITO_IDP_URL \
    REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID \
    REACT_APP_COGNITO_REGION=$COGNITO_REGION \
    npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine
# Copy the entire build directory, preserving the structure
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]