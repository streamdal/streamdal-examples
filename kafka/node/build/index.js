import { Kafka } from 'kafkajs';
import { OperationType, Streamdal } from "@streamdal/node-sdk/streamdal";
// Configuration for Streamdal SDK
const config = {
    streamdalUrl: "localhost:9090",
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
const sendMessage = async (producer, topic, message) => {
    await producer.send({
        topic,
        messages: [{ value: message }],
    });
};
// Function to process messages produced by the producer
const processProducedMessage = async (streamdal, content) => {
    if (content) {
        // Encoding the content and processing it through Streamdal pipeline
        const data = new TextEncoder().encode(content.toString());
        await streamdal.processPipeline({
            audience: {
                serviceName: "test-service",
                componentName: "kafka",
                operationType: OperationType.PRODUCER,
                operationName: "kafka-producer",
            },
            data
        });
    }
};
// Function to process messages consumed from the topic
const processConsumedMessage = async (streamdal, payload) => {
    const message = payload.message;
    if (message && message.value) {
        // Encoding the content and processing it through Streamdal pipeline
        const data = new TextEncoder().encode(message.value.toString());
        await streamdal.processPipeline({
            audience: {
                serviceName: "test-service",
                componentName: "kafka",
                operationType: OperationType.CONSUMER,
                operationName: "kafka-consumer",
            },
            data
        });
    }
};
const setupConsumer = async () => {
    const kafka = new Kafka({ clientId: 'my-app', brokers: [kafkaBrokerUrl] });
    const consumer = kafka.consumer({ groupId: 'test-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true });
    // Setting up message consumption and processing
    await consumer.run({
        eachMessage: async (payload) => {
            await processConsumedMessage(streamdal, payload);
        },
    });
};
const setupProducer = async () => {
    const kafka = new Kafka({ clientId: 'my-app', brokers: [kafkaBrokerUrl] });
    const producer = kafka.producer();
    await producer.connect();
    // Sending a message at intervals and processing it
    setInterval(async () => {
        const messageContent = JSON.stringify({ key: "value" }); // simplified example data
        await sendMessage(producer, TOPIC_NAME, messageContent);
        await processProducedMessage(streamdal, Buffer.from(messageContent));
    }, 1000);
};
const setup = async () => {
    await setupProducer();
    await setupConsumer();
};
setup().catch(console.error);
//# sourceMappingURL=index.js.map