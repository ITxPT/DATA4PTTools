APP_NAME ?= greenlight
DOCKER_TAG ?= $(shell git log --format="%h" -n 1)

run-web:
	cd app && npm run dev

run-server:
	go run cmd/*.go server

docker-build:
	docker build -t ${DOCKER_USERNAME}/${APP_NAME}:${DOCKER_TAG} .

docker-push:
	docker push ${DOCKER_USERNAME}/${APP_NAME}:${DOCKER_TAG}

docker-release:
	docker pull ${DOCKER_USERNAME}/${APP_NAME}:${DOCKER_TAG}
	docker tag ${DOCKER_USERNAME}/${APP_NAME}:${DOCKER_TAG} ${DOCKER_USERNAME}/${APP_NAME}:latest
	docker push ${DOCKER_USERNAME}/${APP_NAME}:latest

# example: make docker-buildx-release DOCKER_USERNAME=lekojson DOCKER_TAG=0.5.1
docker-buildx-release:
	docker buildx build \
		--platform=linux/amd64 \
		--platform=linux/arm64 \
		-t ${DOCKER_USERNAME}/${APP_NAME}:${DOCKER_TAG} \
		-t ${DOCKER_USERNAME}/${APP_NAME}:latest \
		--push \
		.
