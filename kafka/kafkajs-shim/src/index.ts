import { faker } from "@faker-js/faker";
import { Kafka } from "@streamdal/kafkajs";

//
// If you want to configure streamdal via code (and not env vars), uncomment
// the following configs here and on the Kafka client and operations below.
//
// const streamdalConfigs = {
//   streamdalUrl: "localhost:8082",
//   streamdalToken: "1234",
//   serviceName: "user-management-service",
//   pipelineTimeout: "100",
//   stepTimeout: "10",
//   dryRun: false,
//   quiet: true,
//   disableAutomaticPipelines: false,
//   abortOnError: false
// };
//
// const onboardProducer = {
//   serviceName: "user-management-service",
//   componentName: "kafka",
//   operationType: 2,
//   operationName: "onboard-user",
// };
//
// const internalConsumerAudience = {
//   serviceName: "user-management-service",
//   componentName: "kafka",
//   operationType: 1,
//   operationName: "internal-onboard-user",
// };
//
// const externalConsumerAudience = {
//   serviceName: "user-management-service",
//   componentName: "kafka",
//   operationType: 1,
//   operationName: "external-onboard-user",
// };


const kafka = new Kafka({
  clientId: "user-management",
  brokers: ["localhost:9092", "localhost:9092"],
  //
  // streamdalConfigs
});

const producer = kafka.producer();
const internalConsumer = kafka.consumer({
  groupId: "internal-user-management",
});
const externalConsumer = kafka.consumer({ groupId: "external-user-data" });

export const run = async () => {
  await producer.connect();

  setInterval(() => {
    const user = {
      email: faker.internet.email(),
      name: faker.internet.displayName(),
    };

    console.log("################################");
    console.log("\n");
    console.log("producing new user message", user);
    console.log("\n");
    console.log("################################");

    producer.send({
      topic: "user-onboard",
      messages: [
        {
          value: JSON.stringify(user),
        },
      ],
      //
      // streamdalAudience: onboardProducer
    });
  }, 1000);

  await internalConsumer.connect();
  await internalConsumer.subscribe({
    topic: "user-onboard",
    fromBeginning: true,
  });

  await internalConsumer.run({
    eachMessage: async ({ partition, message }: any) => {
      console.log("################################");
      console.log("\n");
      console.log("internal consumer message", {
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });

      try {
        message.value &&
          console.log("parsed", JSON.parse(message.value.toString()));
      } catch (e) {
        console.log("error parsing result");
      }

      console.log("\n");
      console.log("################################");
    },
  });

  await externalConsumer.connect();
  await externalConsumer.subscribe({
    topic: "user-onboard",
    fromBeginning: true,
  });

  await externalConsumer.run({
    eachMessage: async ({ partition, message }: any) => {
      console.log("################################");
      console.log("\n");
      console.log("external consumer message", {
        partition,
        offset: message.offset,
        value: message.value?.toString(),
      });

      try {
        message.value &&
          console.log("parsed", JSON.parse(message.value.toString()));
      } catch (e) {
        console.log("error parsing result");
      }

      console.log("\n");
      console.log("################################");
    },
  });
};

run();
