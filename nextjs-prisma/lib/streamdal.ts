import { Streamdal, StreamdalConfigs } from "@streamdal/node-sdk";

const config: StreamdalConfigs = {
  streamdalUrl: "localhost:8082",
  streamdalToken: "1234",
  serviceName: "user-onboard-service",
  pipelineTimeout: "100",
  stepTimeout: "10",
  dryRun: false,
  quiet: true
};

export const streamdal = new Streamdal(config);
