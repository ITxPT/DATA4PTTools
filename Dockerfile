FROM golang:1.17
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y libxml2-dev
RUN mkdir /greenlight
ADD . /greenlight
WORKDIR /greenlight
RUN go mod download
RUN go build -o gcli cmd/*.go
ENTRYPOINT ["/greenlight/gcli", "validate"]
