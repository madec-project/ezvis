# In association with Dockerfile
ezvis /root/data --connexionURI "mongodb://${EZMASTER_MONGODB_HOST_PORT:-ezvis_db:27017}/castor" --port 3000
