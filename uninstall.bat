@echo off
docker compose down --rmi all -v
cd .. && rmdir /s /q karpa
echo Karpa removed.
