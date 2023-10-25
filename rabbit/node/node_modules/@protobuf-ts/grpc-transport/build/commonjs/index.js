"use strict";
// Public API of the grpc-web transport.
// Note: we do not use `export * from ...` to help tree shakers,
// webpack verbose output hints that this should be useful
Object.defineProperty(exports, "__esModule", { value: true });
var grpc_transport_1 = require("./grpc-transport");
Object.defineProperty(exports, "GrpcTransport", { enumerable: true, get: function () { return grpc_transport_1.GrpcTransport; } });
