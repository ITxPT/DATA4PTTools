FROM golang:1.17
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y libxml2-dev
RUN mkdir /app
ADD . /app
WORKDIR /app
RUN go mod download
RUN go build -o greenlight .
ENTRYPOINT ["/app/greenlight"]
