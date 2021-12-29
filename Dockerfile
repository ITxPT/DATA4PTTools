FROM golang:1.17
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y libxml2-dev
RUN mkdir /greenlight
ADD . /usr/local/greenlight
WORKDIR /usr/local/greenlight
RUN go mod download
RUN go build -o glc cmd/*.go
ENTRYPOINT ["/usr/local/greenlight/glc", "validate"]
