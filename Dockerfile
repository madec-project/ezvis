FROM node:4.4.0

WORKDIR /app
COPY ./package.json /app
RUN npm install --production
COPY . /app

ENTRYPOINT ./docker-entrypoint.sh
EXPOSE 3000