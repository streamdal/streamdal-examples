import amqplib from 'amqplib';
import { OperationType, Streamdal, StreamdalConfigs, SDKResponse } from "@streamdal/node-sdk";

// Configuration for Streamdal SDK
const config: StreamdalConfigs = {
  streamdalUrl: "localhost:8082",
  streamdalToken: "1234",
  serviceName: "test-service-name",
  pipelineTimeout: "100",
  stepTimeout: "10",
};

const EXCHANGE_NAME = 'example_exchange';
const ROUTING_KEY = 'example_routing_key';
const QUEUE_NAME = 'example_queue';
const rabbitmqUrl = 'amqp://127.0.0.1:5672';

// Initializing Streamdal instance with the provided configuration
const streamdal = new Streamdal(config);

// Function to send message to RabbitMQ
const sendMessage = async (
  channel: amqplib.Channel,
  exchange: string,
  routingKey: string,
  message: string
) => {
  await channel.publish(exchange, routingKey, Buffer.from(message));
};

// Function to process messages produced by the producer
const processProducedMessage = async (content: Buffer): Promise<SDKResponse> => {
  // Encoding the content and processing it through Streamdal pipeline
  const data = new TextEncoder().encode(JSON.stringify(content));
  return streamdal.process({
    audience: {
      serviceName: "test-service",
      componentName: "rabbitmq",
      operationType: OperationType.PRODUCER,
      operationName: "rabbitmq-producer",
    },
    data
  });
};

// Function to process messages consumed from the queue
const processConsumedMessage = async (msg: amqplib.ConsumeMessage): Promise<SDKResponse> => {
  // Encoding the content and processing it through Streamdal pipeline
  const data = new TextEncoder().encode(JSON.stringify(msg.content));
  return streamdal.process({
    audience: {
      serviceName: "test-service",
      componentName: "rabbitmq",
      operationType: OperationType.CONSUMER,
      operationName: "rabbitmq-consumer",
    },
    data
  });
};

const setupConsumer = async () => {
  const connection = await amqplib.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  const queue = QUEUE_NAME;
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, EXCHANGE_NAME, ROUTING_KEY);

  // Setting up message consumption and acknowledging the messages after processing
  channel.consume(queue, async (msg) => {
    if (msg == null) {
      console.log("No message found")
      return;
    }

    const processed: SDKResponse = await processConsumedMessage(msg);

    if (processed.error) {
      //
      // you could conditionally not not ack message on pipeline errors
      console.error("Error consuming message", processed.errorMessage)
    }

    console.error("Error consuming message", processed.errorMessage)
  }, { noAck: false });
};

const setupProducer = async () => {
  const connection = await amqplib.connect(rabbitmqUrl);
  const channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  const queue = QUEUE_NAME;
  await channel.assertQueue(queue, { durable: false });
  await channel.bindQueue(queue, EXCHANGE_NAME, ROUTING_KEY);

  // Sending a message at intervals and processing it
  setInterval(async () => {
    const messageContent = JSON.stringify({ key: "value" });
    const processed = await processProducedMessage(Buffer.from(messageContent))

    if (processed.error) {
      //
      // you could conditionally not send the message on pipeline errors
      console.error("Error producing message", processed.errorMessage)
    }

    await sendMessage(channel, EXCHANGE_NAME, ROUTING_KEY, messageContent);
  }, 1000);
};

const setup = async () => {
  try {
    await setupProducer();
    await setupConsumer();
  } catch (e) {
    console.error(e)
  }
};

setup();
