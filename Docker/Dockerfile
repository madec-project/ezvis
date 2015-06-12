FROM ubuntu:14.04

# The next line is useful only if you are behind a proxy
#ENV http_proxy=http://proxyout.domain.com:8080 https_proxy=http://proxyout.domain.com:8080
 
RUN apt-get update -y
RUN apt-get install nodejs -y
RUN ln -s /usr/bin/nodejs /usr/bin/node
RUN apt-get install npm -y
RUN npm install --production ezvis -g
 
ADD startup.sh /
 
EXPOSE 3000
 
CMD bash /startup.sh
