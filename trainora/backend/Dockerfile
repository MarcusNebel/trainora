FROM golang:1.24.3-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server .

EXPOSE 3000

CMD ["./server"]