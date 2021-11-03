FROM golang:alpine3.14

RUN mkdir /app

ADD . /app

WORKDIR /app

RUN go build -o greenlight .

CMD ["/app/greenlight"]
