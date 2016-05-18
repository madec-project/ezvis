# In association with Dockerfile
ezvis /root/data --connexionURI "mongodb://${MONGODB_URI:-ezvis_db:27017}/castor" --port 3000
