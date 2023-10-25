import amqplib from 'amqplib';
import { Audience, OperationType, Streamdal, StreamdalConfigs } from "@streamdal/node-sdk/streamdal";

// Configuration for Streamdal SDK
const config: StreamdalConfigs = {
  streamdalUrl: "localhost:9090",
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
const processProducedMessage = async (streamdal: Streamdal, content: Buffer) => {
  if (content) {
    // Encoding the content and processing it through Streamdal pipeline
    const data = new TextEncoder().encode(content.toString());
    await streamdal.processPipeline({
      audience: {
        serviceName: "test-service",
        componentName: "rabbitmq",
        operationType: OperationType.PRODUCER,
        operationName: "rabbitmq-producer",
      },
      data
    });
  }
};

// Function to process messages consumed from the queue
const processConsumedMessage = async (streamdal: Streamdal, msg: amqplib.ConsumeMessage | null) => {
  if (msg) {
    // Encoding the content and processing it through Streamdal pipeline
    const data = new TextEncoder().encode(msg.content.toString());
    await streamdal.processPipeline({
      audience: {
        serviceName: "test-service",
        componentName: "rabbitmq",
        operationType: OperationType.CONSUMER,
        operationName: "rabbitmq-consumer",
      },
      data
    });
  }
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
    await processConsumedMessage(streamdal, msg);
    if (msg !== null) {
      channel.ack(msg);
    }
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
    const messageContent = JSON.stringify({ key: "value" });  // simplified example data
    await sendMessage(channel, EXCHANGE_NAME, ROUTING_KEY, messageContent);
    await processProducedMessage(streamdal, Buffer.from(messageContent));
  }, 1000);
};

const setup = async () => {
  await setupProducer();
  await setupConsumer();
};

setup().catch(console.error);