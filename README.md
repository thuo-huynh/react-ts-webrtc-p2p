# WebRTC-Typescript-React

## Features

- 1:1 communication (peer to peer)
- React with Typescript
- Docker

## How to start

### Docker version

```yml
# server use 8000 port
# client use 3000 port
# You can connect to http://localhost:3000
docker-compose up -d
```

### Non-Docker version(Node.js and React.js)

You need to install Node.js

#### Start Server

```bash
cd server
yarn dev
```

#### Start Client

```bash
cd client
yarn start
```

## Demo

To see a live demonstration of this application, follow these steps:

1. Open two browser tabs.
2. In each tab, access `http://localhost:3000`.

This will allow you to test the 1:1 communication feature in the application.
