import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { streamdalPlugin } from "./streamdalPlugin.js";
import { faker } from "@faker-js/faker";
import * as crypto from "crypto";

const typeDefs = `#graphql
  type Customer {
    id: String
    name: String
    email: String
    orders: [Order]
  }
  
  type Order {
    id: String
    date: String
    paymentToken: String
    notes: String
    total: Float
    customer: Customer
  }

  type Query {
    customers: [Customer]
    orders: [Order]
  }
  
  type Mutation {
    addCustomer(name: String, email: String): Customer
    addOrder(customerId: String, paymentToken: String, paymentNote: String, total: Float): Customer
  }
`;

const customers = [
  {
    id: crypto.randomUUID(),
    email: faker.internet.email(),
    name: faker.internet.displayName(),
  },
  {
    id: crypto.randomUUID(),
    email: faker.internet.email(),
    name: faker.internet.displayName(),
  },
];

const orders = [
  {
    id: crypto.randomUUID(),
    date: new Date(),
    paymentToken: crypto.randomUUID(),
    notes: "Please gift wrap!",
    total: 123.45,
    customer: customers[0],
  },
];

const resolvers = {
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    customers: (_parent, _args, contextValue) => {
      //
      // You can optionally set the audience manually per operation.
      // Useful if you have configured streamdal to disable automatic pipelines.
      // contextValue.streamdalAudience = {
      //   serviceName: "user-onboard-service",
      //   componentName: "apollo-server",
      //   operationType: OperationType.CONSUMER,
      //   operationName: "customer-fetch",
      // };

      return customers;
    },
    orders: () => orders,
  },
  Mutation: {
    addCustomer: async (_, { name, email }) => {
      if (!name || !email) {
        throw Error("name and email required");
      }
      if (customers.find((c) => c.email === email)) {
        throw Error("customer with this email already exists");
      }
      const customer = { id: crypto.randomUUID(), name, email };
      customers.push(customer);
      return customer;
    },

    addOrder: async (_, { paymentToken, notes, total, customerId }) => {
      if (!paymentToken || !total || !customerId) {
        throw Error("paymentToken total and customerId are required");
      }
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) {
        throw Error("customer does not exist");
      }
      const order = {
        id: crypto.randomUUID(),
        date: new Date(),
        paymentToken,
        total,
        customer,
        notes,
      };
      orders.push(order);
      return order;
    },
  },
};

//
// You can optionally configure the streamdal apollo server plugin entirely
// with code instead of env vars. See below how we pass them to the streamdalPlugin()
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

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [await streamdalPlugin(/* streamdalConfigs */)],
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at: ${url}`);
