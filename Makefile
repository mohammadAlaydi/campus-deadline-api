.PHONY: build run stop

build:
	docker compose build

run:
	docker compose up -d --build --wait

stop:
	docker compose down
