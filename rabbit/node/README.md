# Streamdal SDK Integration Example

This repository demonstrates how to integrate Streamdal SDK into a Node.js application using RabbitMQ for message queueing.

## Example code lives in 
```

├── src
│   └── index.ts

```

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Node.js and npm installed on your machine.

## Setup and Running

1. **Clone the repository** to your local machine.

```bash
git clone https://github.com/streamdal/streamdal-examples
cd streamdal-examples/rabbit/node
```

2. **Install the necessary Node.js dependencies**.

```bash
npm install
```

3. **Start the Docker services**. using the provided `docker-compose.yaml` file.

```bash
docker-compose up -d
```

This will bring up the Streamdal server, RabbitMQ, Redis, and other necessary services as defined in the `docker-compose.yaml` file.

4. **Run the Node.js application**.

```bash
npm start
```

Your Node.js application should now be running, and interacting with the RabbitMQ and Streamdal services. You can monitor the RabbitMQ management interface at `http://localhost:15672` and Streamdal console at `http://localhost:3000`.

5. **Stop the Docker services** once you are done.

```bash
docker-compose down
```

## Monitoring and Debugging

- **Streamdal Console**: Accessible at `http://localhost:3000`.
- **RabbitMQ Management Interface**: Accessible at `http://localhost:15672` user: guest pass: guest.

For further debugging, check the logs of the Docker containers using the following command:

```bash
docker logs <container-name>
```

## Cleanup

To remove the Docker containers and networks created during this setup, run:

```bash
docker-compose down --volumes
```
