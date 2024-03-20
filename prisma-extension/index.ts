import { PrismaClient } from "@prisma/client";
import { streamdalExtension } from "@streamdal/prisma-extension-streamdal";
import { faker } from "@faker-js/faker";

//
// You can optionally configure the streamdal apollo server plugin entirely
// with code instead of env vars. See below how we pass them to the streamdalExtension
// and individual Prisma operations
//
// const streamdalConfigs = {
//   streamdalUrl: "localhost:8082",
//   streamdalToken: "1234",
//   serviceName: "customer-order-service",
//   pipelineTimeout: "100",
//   stepTimeout: "10",
//   dryRun: false,
//   quiet: true,
//   disableAutomaticPipelines: true,
//   abortOnError: false
// };
//
//
// const producerAudience = {
//   serviceName: "test-prisma-service",
//   componentName: "prisma",
//   operationType: OperationType.PRODUCER,
//   operationName: "prisma-user",
// };

//
// This will automatically map all prisma operations and look for pipelines.
// You can optionally configure this via code as well.
const streamdal = streamdalExtension(/*streamdalConfigs*/);

const prisma = new PrismaClient().$extends(streamdal);

const example = () => {
  setInterval(async () => {
    console.log("-----------------------");

    const data = {
      email: faker.internet.email(),
      name: faker.internet.displayName(),
      ipAddress: faker.internet.ipv4(),
    };
    console.log("creating user:", data);

    const result = await prisma.user.create({
      data,
      //
      // if you have disabled automatic pipelines, you can enable the via code per operation like so:
      // streamdalAudience: producerAudience,
    });

    console.log("fetch created user with findFirst:");
    console.log(await prisma.user.findFirst({ where: { id: result.id } }));

    console.log("fetch all users with findMany");
    console.log(await prisma.user.findMany());
    console.log("-----------------------");
  }, 2000);
};

example();
