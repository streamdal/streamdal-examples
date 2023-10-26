import { ClientStreamingCall, DuplexStreamingCall, MethodInfo, RpcOptions, RpcTransport, ServerStreamingCall, UnaryCall } from "@protobuf-ts/runtime-rpc";
import { GrpcCallOptions, GrpcOptions } from "./grpc-options";
export declare class GrpcTransport implements RpcTransport {
    private readonly defaultOptions;
    private readonly client;
    constructor(defaultOptions: GrpcOptions);
    mergeOptions(options?: Partial<RpcOptions>): RpcOptions;
    private pickCallOptions;
    unary<I extends object, O extends object>(method: MethodInfo<I, O>, input: I, options: GrpcCallOptions): UnaryCall<I, O>;
    serverStreaming<I extends object, O extends object>(method: MethodInfo<I, O>, input: I, options: GrpcCallOptions): ServerStreamingCall<I, O>;
    clientStreaming<I extends object, O extends object>(method: MethodInfo<I, O>, options: GrpcCallOptions): ClientStreamingCall<I, O>;
    duplex<I extends object, O extends object>(method: MethodInfo<I, O>, options: GrpcCallOptions): DuplexStreamingCall<I, O>;
    close(): void;
}
