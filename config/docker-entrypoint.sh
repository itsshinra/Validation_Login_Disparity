#!/bin/bash

/tmp/setup_db.sh
cd /app
source /root/.nvm/nvm.sh
# npm start
npm run debug
