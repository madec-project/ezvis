FROM node:4.4.0

WORKDIR /app
COPY ./package.json /app
RUN npm install --production
COPY . /app

# ezmasterization of ezvis
# see https://github.com/Inist-CNRS/ezmaster
RUN echo '{ \
  "httpPort": 3000, \
  "configPath": "/app/ezmaster-dataset/config.json", \
  "dataPath":   "/app/ezmaster-dataset/data/" \
}' > /etc/ezmaster.json
# add the dataset for ezmaster
ADD https://raw.githubusercontent.com/madec-project/showcase/master/demo_films/repository/films.csv \
    /app/ezmaster-dataset/data/films.csv
ADD https://raw.githubusercontent.com/madec-project/showcase/master/demo_films/repository.json \
    /app/ezmaster-dataset/config.json

ENTRYPOINT ./docker-entrypoint.sh
EXPOSE 3000