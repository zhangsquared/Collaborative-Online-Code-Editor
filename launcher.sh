#! /bin/bash

# # deffensively clear out port
# fuser -k 3000/tcp
# fuser -k 5000/tcp

# service redis_6379 start

# service nginx start

# cd ./oj-server
# nodemon server.js &

# cd ../executor
# pip3 install -r requirements.txt
# python3 eecutor_server.py &

# echo "================"
# read -p "Press [enter] to terminate processes" PRESSKEY

# fuser -k 3000/tcp
# fuser -k 5000/tcp

# service redis_6379 stop
# service nginx stop


cd "$(dirname "${BASH_SOURCE[0]}")"
echo "bash script starts at: $(pwd)"

# just in case, just build client side again, but actually can just use Public
cd oj-client
echo "start building client at: $(pwd)"
ng build

# start redis server
echo "start redis server"
redis-server &

# start executor
cd ../executor
echo "start executor at: $(pwd)"
python3 executor_server.py &

# start node server
cd ../oj-server
echo "start node server at: $(pwd)"
npm start &

read -n 1 -s -r -p "Press any key to stop"

pkill -f node # shut down node server
cd ../executor
pkill -9 -f executor_server.py # shut down executor
redis-cli shutdown # shut down redis
