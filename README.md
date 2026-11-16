campus deadline api
===================

a small api to keep track of course deadlines and mark them done

it uses node and express and saves the deadlines in a json file

run it with docker
------------------

open a terminal in the project folder and run these

```sh
docker build -t campus-deadline-api .
docker run -d --name campus-deadline-api -p 127.0.0.1:3000:3000 -v campus-deadline-data:/app/data campus-deadline-api
```

the api runs on port 3000 and u dont need to set any env values

if port 3000 is busy change the first port number in the docker run command to 3001 and use that port when u open the api

the volume keeps the deadlines when u stop or replace the container

try it
------

open [the api](http://localhost:3000) to see the routes and [health](http://localhost:3000/health) to check its running

run this in powershell to add a deadline and mark it done

```powershell
$url = 'http://localhost:3000'
$body = @{ title = 'docker lab'; course = 'operating systems'; due = '2027-01-21' } | ConvertTo-Json
$deadline = Invoke-RestMethod "$url/deadlines" -Method Post -ContentType 'application/json' -Body $body
Invoke-RestMethod "$url/deadlines/$($deadline.id)" -Method Patch -ContentType 'application/json' -Body '{"done":true}'
```

open [done deadlines](http://localhost:3000/deadlines?status=done) and u should see it there

send a delete request to the same deadline url to remove it

stop and clean up
-----------------

```sh
docker stop campus-deadline-api
docker rm campus-deadline-api
```

if u want to delete the saved deadlines and remove the image too run these

```sh
docker volume rm campus-deadline-data
docker image rm campus-deadline-api
```

run it with compose
-------------------

use this from the project folder if u want compose to build and start it for u

```sh
docker compose up -d --build --wait
docker compose down
```

compose uses its own volume so it has a separate list of deadlines

set `HOST_PORT` before starting compose if u want a different port

u can also use `make build` `make run` and `make stop` if u have make installed
