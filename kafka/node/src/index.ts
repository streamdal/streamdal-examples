import { EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { ExecStatus, OperationType, SDKResponse, Streamdal, StreamdalConfigs } from "@streamdal/node-sdk";

// Configuration for Streamdal SDK
const config: StreamdalConfigs = {
  streamdalUrl: "localhost:8082",
  streamdalToken: "1234",
  serviceName: "test-service-name",
  pipelineTimeout: "100",
  stepTimeout: "10",
};

const TOPIC_NAME = 'example_topic';
const kafkaBrokerUrl = 'localhost:9092';

// Initializing Streamdal instance with the provided configuration
const streamdal = new Streamdal(config);

// Function to send message to Kafka
const sendMessage = async (producer: Producer, topic: string, message: string) => {
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
};

// Function to process messages produced by the producer
const processProducedMessage = async (content: Buffer) => {
  // Encoding the content and processing it through Streamdal pipeline
  const data = new TextEncoder().encode(content.toString());
  return streamdal.process({
    audience: {
      serviceName: "test-service",
      componentName: "kafka",
      operationType: OperationType.PRODUCER,
      operationName: "kafka-producer",
    },
    data
  });
};

// Function to process messages consumed from the topic
const processConsumedMessage = async (message: string): Promise<SDKResponse> => {
  // Encoding the content and processing it through Streamdal pipeline
  const data = new TextEncoder().encode(message);
  return streamdal.process({
    audience: {
      serviceName: "test-service",
      componentName: "kafka",
      operationType: OperationType.CONSUMER,
      operationName: "kafka-consumer",
    },
    data
  });

};

const setupConsumer = async () => {
  const kafka = new Kafka({ clientId: 'my-app', brokers: [kafkaBrokerUrl] });
  const consumer = kafka.consumer({ groupId: 'test-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });

  // Setting up message consumption and processing
  await consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      if (!payload?.message?.value) {
        console.log("No message found")
        return;
      }
      const processed:SDKResponse =
        await processConsumedMessage(JSON.stringify(payload.message.value));

      if (processed.status === ExecStatus.ERROR) {
        //
        // conditional error processing
        console.error("Error consuming message", processed.statusMessage)
      }
    },
  });
};

const setupProducer = async () => {
  const kafka = new Kafka({ clientId: 'my-app', brokers: [kafkaBrokerUrl] });
  const producer = kafka.producer();
  await producer.connect();

  // Sending a message at intervals and processing it
  setInterval(async () => {
    const messageContent = JSON.stringify({ key: "value" });
    const processed = await processProducedMessage(Buffer.from(messageContent))

    if (processed.status === ExecStatus.ERROR) {
      //
      // conditional error processing
      console.error("Error consuming message", processed.statusMessage)
    }

    await sendMessage(producer, TOPIC_NAME, messageContent);
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
