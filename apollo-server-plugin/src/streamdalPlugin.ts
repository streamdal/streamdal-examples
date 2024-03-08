import {
  BaseContext,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestListener,
} from "@apollo/server";
import {
  Audience,
  registerStreamdal,
  SDKResponse,
  StreamdalConfigs,
  StreamdalRegistration,
} from "@streamdal/node-sdk";

export type Streamdal = {
  configs: StreamdalConfigs & {
    abortOnError?: boolean;
    disableAutomaticPipelines?: boolean;
  };
  registration: StreamdalRegistration;
};

const register = async (
  streamdalConfigs?: StreamdalConfigs,
): Promise<Streamdal> => {
  if (streamdalConfigs) {
    return {
      configs: streamdalConfigs,
      registration: await registerStreamdal(streamdalConfigs),
    };
  }

  if (
    process.env.STREAMDAL_URL &&
    process.env.STREAMDAL_TOKEN &&
    process.env.STREAMDAL_SERVICE_NAME
  ) {
    return {
      registration: await registerStreamdal({
        streamdalUrl: process.env.STREAMDAL_URL,
        streamdalToken: process.env.STREAMDAL_TOKEN,
        serviceName: process.env.STREAMDAL_SERVICE_NAME,
      }),
      configs: {
        streamdalUrl: process.env.STREAMDAL_URL,
        streamdalToken: process.env.STREAMDAL_TOKEN,
        serviceName: process.env.STREAMDAL_SERVICE_NAME,
        abortOnError: !!process.env.STREAMDAL_ABORT_ON_ERROR,
        disableAutomaticPipelines:
          !!process.env.STREAMDAL_DISABLE_AUTOMATIC_PIPELINES,
      },
    };
  }

  return null;
};

export interface StreamdalContext extends BaseContext {
  streamdalAudience?: Audience;
}

export const streamdalPlugin = async (streamdalConfigs?: StreamdalConfigs) => {
  const streamdal: Streamdal | null = await register(streamdalConfigs);
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return {
    async serverWillStart() {
      console.debug("streamdal apollo server plugin is runnning...");
    },
    async requestDidStart(): Promise<GraphQLRequestListener<any>> {
      return {
        async didResolveOperation({
          request,
          operationName,
          contextValue,
        }: GraphQLRequestContextDidResolveOperation<StreamdalContext>) {
          if (
            operationName === "IntrospectionQuery" &&
            streamdal &&
            //
            // Suppress ts errors as body is typed as unknown
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            request.http?.body?.variables
          ) {
            const audience = contextValue.streamdalAudience ?? {
              serviceName: streamdal.configs.serviceName,
              componentName: "apollo-server",
              operationType: 1,
              operationName: operationName,
            };

            const streamdalResult: SDKResponse =
              await streamdal.registration.process({
                audience,
                data: encoder.encode(JSON.stringify(request.variables)),
              });

            const data = decoder.decode(streamdalResult.data);
            request.http.body["variables"] = JSON.parse(data);
          }
        },

        async willSendResponse({
          operationName,
          response,
          contextValue,
        }: GraphQLRequestContextWillSendResponse<StreamdalContext>) {
          if (
            operationName !== "IntrospectionQuery" &&
            streamdal &&
            response.body &&
            response.body.kind === "single" &&
            response.body.singleResult.data
          ) {
            const audience = contextValue.streamdalAudience ?? {
              serviceName: streamdal.configs.serviceName,
              componentName: "apollo-server",
              operationType: 1,
              operationName: operationName,
            };

            const streamdalResult: SDKResponse =
              await streamdal.registration.process({
                audience,
                data: encoder.encode(
                  JSON.stringify(response.body.singleResult.data),
                ),
              });

            const data = decoder.decode(streamdalResult.data);
            response.body.singleResult.data = JSON.parse(data);
          }
        },
      };
    },
  };
};
