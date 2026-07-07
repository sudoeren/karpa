#!/bin/sh
docker compose down --rmi all -v 2>/dev/null
cd .. && rm -rf karpa
echo "Karpa removed."
