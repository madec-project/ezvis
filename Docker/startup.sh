# In association with Dockerfile
if [[ -z "$MONGO_PORT_27017_TCP_ADDR" && -z "$MONGO_PORT_27017_TCP_PORT" ]]
then
	ezvis /root/data --port 3000
else
	ezvis /root/data --connexionURI "mongodb://$MONGO_PORT_27017_TCP_ADDR:$MONGO_PORT_27017_TCP_PORT/castor" --port 3000
fi
