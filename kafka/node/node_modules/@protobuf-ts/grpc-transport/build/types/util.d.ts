import * as grpc from "@grpc/grpc-js";
import { RpcMetadata } from "@protobuf-ts/runtime-rpc";
import { MetadataOptions } from "@grpc/grpc-js";
/**
 * Is the given argument a ServiceError as provided
 * by @grpc/grpc-js?
 *
 * A ServiceError is a specialized Error object, extended
 * with the properties "code", "details" and "metadata".
 */
export declare function isServiceError(arg: any): arg is grpc.ServiceError;
/**
 * Parse a gRPC status code from a string.
 */
export declare function rpcCodeToGrpc(from: string): grpc.status | undefined;
/**
 * Convert our RPC Metadata to gRPC Metadata.
 */
export declare function metadataToGrpc(from: RpcMetadata, options?: MetadataOptions, indempotentMethod?: boolean): grpc.Metadata;
/**
 * Convert gRPC Metadata to our RPC Metadata.
 */
export declare function metadataFromGrpc(from: grpc.Metadata): RpcMetadata;
