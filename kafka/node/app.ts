import amqplib from 'amqplib';
import {
  Audience,
  OperationType,
  Streamdal,
  StreamdalConfigs,
  SDKResponse
} from '@streamdal/node-sdk';

const streamdalConfig: StreamdalConfigs = {
  streamdalUrl: process.env.STREAMDAL_URL!,
  streamdalToken: process.env.STREAMDAL_TOKEN!,
  serviceName: process.env.STREAMDAL_SERVICE_NAME!,
};

const rabbitmqUrl = 'amqp://127.0.0.1:5672';

const sendMessage = async (channel: amqplib.Channel, queue: string, message: string) => {
  await channel.sendToQueue(queue, Buffer.from(message));
};

const processMessage = async (msg: amqplib.ConsumeMessage | null) => {
  const streamdal = new Streamdal(streamdalConfig);
  const audience: Audience = {
    serviceName: "your-service-name",
    componentName: "rabbitmq",
    operationType: OperationType.CONSUMER,
    operationName: "your-operation-name",
  };
  if (msg) {
    const data = new TextEncoder().encode(msg.content.toString());
    const result: SDKResponse = await streamdal.process({ audience, data });
    if (result.error) {
      console.error("Pipeline error", result.message);
      console.dir(result.stepStatuses);  // Optional
    } else {
      console.info("Pipeline success!");
      console.log(result.data);  // Process result data as needed
    }
  }
};

const setup = async () => {
  const connection = await amqplib.connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  const queue = 'exampleQueue';
  await channel.assertQueue(queue, { durable: false });

  // Send a message
  setInterval(async () => {
    await sendMessage(channel, queue, 'Hello, world!');
  }, 1000);

  // Set up message consumption
  channel.consume(queue, processMessage, { noAck: true });
};

setup().catch(console.error);
