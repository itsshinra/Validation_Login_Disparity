FROM mongo:latest

# setup variables
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/London

# update and install curl/gnupg
RUN apt update
RUN apt -y full-upgrade
RUN apt install -y curl python3

# set nvm environment variables
RUN mkdir /root/.nvm
ENV NVM_DIR /root/.nvm

# install nodejs
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN bash -c "source /root/.nvm/nvm.sh && nvm install node"

# add entrypoint script
ADD ./config/docker-entrypoint.sh /usr/local/docker-entrypoint.sh
RUN chmod +x /usr/local/docker-entrypoint.sh
RUN cp /etc/mongod.conf.orig /etc/mongod.conf

# add db setup script
ADD ./db /tmp/db/
RUN chmod +wr /tmp/db/
ADD ./config/setup_db.sh /tmp/setup_db.sh
RUN chmod +x /tmp/setup_db.sh

# add and setup nodejs app
RUN mkdir /app
COPY src/ /app
WORKDIR /app
RUN bash -c "source /root/.nvm/nvm.sh && npm install"

# creds
# htb-student@academy.htb:HTB_@cademy_student!

EXPOSE 9229
EXPOSE 5000
CMD ["/bin/bash","/usr/local/docker-entrypoint.sh"]
