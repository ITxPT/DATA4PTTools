FROM golang:1.17-alpine as builder
RUN apk add libxml2-dev gcc musl-dev nodejs npm
RUN mkdir /greenlight
ADD . /usr/local/greenlight
WORKDIR /usr/local/greenlight
RUN go mod download
RUN go build -o glc cmd/*.go
WORKDIR /usr/local/greenlight/app
RUN npm install
RUN npm run build

FROM golang:1.17-alpine
RUN apk add libxml2
WORKDIR /usr/local/greenlight
COPY --from=builder /usr/local/greenlight /usr/local/greenlight
ENTRYPOINT ["/usr/local/greenlight/glc"]
