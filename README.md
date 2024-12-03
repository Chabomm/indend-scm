# 인디앤드코리아 판매자센터

# 공인아이피

# development
UP `docker-compose up --build -d`
DN `docker-compose down --rmi all`

# Production

## nginx
TT `nginx -t`
RE `sudo service nginx restart`

## network 통합
- `docker network create common`
- `docker network ls`

# 컨테이너 logs
docker logs --tail 20 -f backend

## nginx
TT `nginx -t`
RE `sudo service nginx restart`

# 데이터베이스 compose UP
cd /home/smartbaro/database
docker-compose up --build -d

# 데이터베이스 compose DOWN
cd /home/smartbaro/database
docker-compose down --rmi all

# 백앤드 compose UP
cd /home/smartbaro/smartbaro-backend
docker-compose up --build -d

# 백앤드 compose DOWN
cd /home/smartbaro/smartbaro-backend
docker-compose down --rmi all

# 국제바로병원 홈페이지 (front)
배포 `/home/smartbaro/smartbaro/deploy.sh`
원격 `docker exec -it smartbaro-blue sh`
로그 `docker logs --tail 20 -f smartbaro-blue`

# 국제바로병원 홈페이지 (admin)
배포 `/home/smartbaro/smartbaro-admin/deploy.sh`
원격 `docker exec -it admin-blue sh`
로그 `docker logs --tail 20 -f admin-blue`



# 도커 메모리 CPU 사용량 확인
`docker stats`

## 6. 컨테이너 강제 삭제
docker rm -f 9b6a6fb4d43b

## 도커 정리 docker clean (https://depot.dev/blog/docker-clear-cache)
docker-compose down --rmi all
docker image prune -a -f
docker container prune -f
docker builder prune -f
docker volume prune -f
docker system prune -a  -f
docker buildx prune -f
docker network prune -f
docker volume rm $(docker volume ls -f dangling=true -q)
docker volume ls --filter dangling=true
docker network create common
docker system df

## nginx
TT `nginx -t`
RE `sudo service nginx restart`

## database 컨테이너 안에서 db접속
docker exec -it database /bin/bash
[bash-4.4#] mysql -uroot -pmysql_root_password
mysql> use mysql
Database changed
mysql> select user, host from user;


# 리눅스 디렉토리 삭제 directory
rm -rf node_modules

# 디스크 용량 확인
df -h

# linux 파일 용량 검색
cd /home/smartbaro
du -h -d 1

# 폴더별 용량
sudo du -sh * | sort -hr
