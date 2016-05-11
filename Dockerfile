FROM node:4.4.0

ENV MONGO_URI="ezvis_db:27017"
ENV MONGO_DATABASE="castor"

COPY . /app
WORKDIR /app
RUN npm install --production
 
CMD ./cli /root/data --connexionURI "mongodb://$MONGO_URI/$MONGO_DATABASE" --port 3000
EXPOSE 3000