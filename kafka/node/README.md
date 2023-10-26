# Streamdal Kafka Example

This project demonstrates how to set up a Kafka environment with Docker and how to send and consume messages using the Streamdal SDK. It also explains how to monitor your Kafka topics with Kafdrop and how to access the Streamdal dashboard.

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Node.js installed on your machine (if running the application locally).

## Running the Project

1. **Start the Docker Environment**

    Navigate to the project directory and run the following command to bring up the Docker environment:

    ```bash
    docker-compose up -d
    ```

    This command will start all the necessary services defined in the `docker-compose.yaml` file, including Kafka, Kafdrop, and Streamdal.

2. **Run the Application**

    If running the application locally, execute the following command:

    ```bash
    npm install
    npm start
    ```

## Monitoring Kafka with Kafdrop

Kafdrop is a web UI for viewing Kafka topics and browsing consumer groups. The tool displays information such as brokers, topics, partitions, and even lets you view messages.

1. Open your web browser and navigate to [http://localhost:9000](http://localhost:9000).
2. In Kafdrop, you can view the list of topics, see which consumers are consuming from which topics, and even view messages on a topic.

## Accessing Streamdal Dashboard

The Streamdal dashboard provides a graphical interface where you can view the data-graph, metrics, events, and schema.

1. Open your web browser and navigate to the Streamdal dashboard at [http://localhost:3000](http://localhost:3000).
2. In the dashboard, you can:
    - View the **Data-Graph** tab to see the structure of your data and how it's flowing through the system.
    - Visit the **Metrics** tab to see various metrics about your data processing.
    - Check the **Events** tab to view the events that are being processed.
    - Access the **Schema** tab to view and manage the schema of your data.

## Cleaning Up

To stop and remove all the Docker containers, use the following command:

```bash
docker-compose down
```