FROM node:14-alpine3.13
WORKDIR /opt/app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3002
CMD ["node", "index.js"]
