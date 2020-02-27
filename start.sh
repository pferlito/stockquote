#!/bin/bash

# start server
cd server
npm start &
if [ $? -eq 0 ]; then
  echo "server started, pid=$!"
else
  echo "server start failed, exiting."
  exit 1
fi

# start live build server
cd ../client
yarn start && echo "live build server started"

