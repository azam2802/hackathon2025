FROM node:18-bullseye AS build

WORKDIR /app

COPY package.json ./

# Install dependencies
RUN npm install

COPY . .

ENV NODE_ENV=production

RUN npm run build

FROM nginx:stable-bullseye

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]