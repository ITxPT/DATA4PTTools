FROM golang:1.17-alpine as builder
RUN apk add libxml2-dev gcc musl-dev
RUN mkdir /greenlight
ADD . /usr/local/greenlight
WORKDIR /usr/local/greenlight
RUN go mod download
RUN go build -o glc cmd/*.go

FROM golang:1.17-alpine
RUN apk add libxml2
WORKDIR /usr/local/greenlight
COPY --from=builder /usr/local/greenlight /usr/local/greenlight
ENTRYPOINT ["/usr/local/greenlight/glc", "validate"]
