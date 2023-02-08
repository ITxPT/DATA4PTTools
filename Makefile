APP_NAME ?= greenlight
GIT_HASH_LONG ?= $(shell git log --format="%H" -n 1)
DOCKER_TAG ?= $(shell git log --format="%h" -n 1)
BENCH_TIME=1s

run-web:
	cd app && npm run dev

build-web:
	cd app && npm run build

run-server:
	go run cmd/*.go server

build-cli:
	go build cmd*.go -o greenlight

benchmark:
	$(info git hash is $(GIT_HASH_LONG))
	go test -bench=. -benchmem -benchtime=$(BENCH_TIME)

docker-build:
	docker build -t $(DOCKER_USERNAME)/$(APP_NAME):$(DOCKER_TAG) .

docker-push:
	docker push $(DOCKER_USERNAME)/$(APP_NAME):$(DOCKER_TAG)

docker-release:
	docker pull $(DOCKER_USERNAME)/$(APP_NAME):$(DOCKER_TAG)
	docker tag $(DOCKER_USERNAME)/$(APP_NAME):$(DOCKER_TAG) $(DOCKER_USERNAME)/$(APP_NAME):latest
	docker push $(DOCKER_USERNAME)/$(APP_NAME):latest

# example: make docker-buildx-release DOCKER_USERNAME=lekojson DOCKER_TAG=0.5.1
docker-buildx-release:
	docker buildx build \
		--platform=linux/amd64 \
		--platform=linux/arm64 \
		-t $(DOCKER_USERNAME)/$(APP_NAME):$(DOCKER_TAG) \
		-t $(DOCKER_USERNAME)/$(APP_NAME):latest \
		--push \
		.
