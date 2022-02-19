FROM node:17.5.0-alpine
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
ENTRYPOINT [ "npm", "start" ]