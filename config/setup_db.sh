#!/bin/bash

# start mongodb
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db --config /etc/mongod.conf

# wait until mongodb is ready
while [[ RET -ne 0 ]]; do
  echo "=> Waiting for confirmation of MongoDB service startup"
  sleep 5
  mongosh admin --eval "help" >/dev/null 2>&1
  RET=$?
done

# set DB variables "values retrieved from /app/.env"
DB_USER=$(grep DB_USER /app/.env | cut -d '"' -f2)
DB_PASS=$(grep DB_PASS /app/.env | cut -d '"' -f2)

# set up the database & user
mongosh <<EOF
use admin
db.createUser({
  user: '$DB_USER',
  pwd: '$DB_PASS',
  roles: [
    {
      role: 'readWrite',
      db: 'academy'
    }
  ]
})
EOF

####################

# Dynamically generate userexams.json "based on current date"
startDate=$(date '+%Y-%m-%d')               # today
endDate=$(date -I -d "$startDate + 31 day") # today + 31 days

cat <<EOF >/tmp/db/userexams.json
[
{
  "userId": "649f2893cba8d0d6e8412182",
  "examId": 1,
  "used": false
},
EOF

# fill in the rest of the exam dates
while [[ "$startDate" < "$endDate" ]]; do
  username=$(
    echo $RANDOM | md5sum | head -c 24
    echo
  )

  # skip some random days (free up pre-selected slots)
  if [[ ! "$startDate" =~ ^.*(12|15|17|21|22|24|25).*$ ]]; then
    cat <<EOF >>/tmp/db/userexams.json
{
  "userId": "${username}",
  "examId": 1,
  "used": false,
  "date": {
    "\$date": "${startDate}T00:00:00Z"
  }
},
EOF
  fi
  startDate=$(date -I -d "$startDate + 1 day")
done

# remove the last comma, add the closing bracket
truncate -s-2 /tmp/db/userexams.json
cat <<EOF >>/tmp/db/userexams.json

]
EOF

####################

# reset/drop db if it exists
mongosh <<EOF
use academy
db.dropDatabase()
EOF

# import all json files in /tmp/db to their respective collections
DB_FILES="/tmp/db/*.json"
for file in $DB_FILES; do
  filename=$(basename -- "$file")
  collection="${filename%.*}"
  mongoimport -d 'academy' -c "$collection" --file="$file" --jsonArray
done
