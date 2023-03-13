FROM golang:1.20-alpine as builder
RUN apk add libxml2-dev gcc musl-dev nodejs npm
RUN mkdir /greenlight
ADD . /usr/local/greenlight
WORKDIR /usr/local/greenlight
RUN go mod download
RUN go build -o glc cmd/*.go
WORKDIR /usr/local/greenlight/app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install
RUN npm run build


FROM golang:1.20-alpine
RUN apk add libxml2
WORKDIR /usr/local/greenlight
COPY --from=builder /usr/local/greenlight/glc /usr/local/greenlight/glc
COPY --from=builder /usr/local/greenlight/xsd /usr/local/greenlight/xsd
COPY --from=builder /usr/local/greenlight/builtin /usr/local/greenlight/builtin
COPY --from=builder /usr/local/greenlight/testdata /usr/local/greenlight/testdata
COPY --from=builder /usr/local/greenlight/app/out /usr/local/greenlight/app/out
ENTRYPOINT ["/usr/local/greenlight/glc"]
