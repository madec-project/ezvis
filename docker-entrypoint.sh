#!/bin/bash

if [ "$MONGO_HOST_PORT" != "" ]; then
  ./cli /app/data --connexionURI "mongodb://$MONGO_HOST_PORT/$MONGO_DATABASE" --port 3000
else
  ./cli /app/data --connexionURI "mongodb://${EZMASTER_MONGODB_HOST_PORT:-ezvis_db:27017}/ezvis" --port 3000
fi
