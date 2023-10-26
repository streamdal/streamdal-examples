import { ClientStreamingCall, Deferred, DeferredState, DuplexStreamingCall, mergeRpcOptions, RpcError, RpcOutputStreamController, ServerStreamingCall, UnaryCall } from "@protobuf-ts/runtime-rpc";
import { Client, status as GrpcStatus } from "@grpc/grpc-js";
import { assert } from "@protobuf-ts/runtime";
import { metadataFromGrpc, isServiceError, metadataToGrpc } from "./util";
export class GrpcTransport {
    constructor(defaultOptions) {
        this.defaultOptions = defaultOptions;
        this.client = new Client(defaultOptions.host, defaultOptions.channelCredentials, defaultOptions.clientOptions);
    }
    mergeOptions(options) {
        return mergeRpcOptions(this.defaultOptions, options);
    }
    pickCallOptions(options) {
        if (options.callOptions) {
            return options.callOptions;
        }
        const co = {};
        if (typeof options.timeout === "number") {
            co.deadline = Date.now() + options.timeout;
        }
        else if (options.timeout) {
            co.deadline = options.timeout;
        }
        return co;
    }
    unary(method, input, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new Deferred(), defMessage = new Deferred(), defStatus = new Deferred(), defTrailer = new Deferred(), call = new UnaryCall(method, meta, input, defHeader.promise, defMessage.promise, defStatus.promise, defTrailer.promise);
        const gCall = this.client.makeUnaryRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), input, gMeta, this.pickCallOptions(opt), (err, value) => {
            if (value) {
                defMessage.resolve(value);
            }
            if (err) {
                const e = new RpcError(err.details, GrpcStatus[err.code], metadataFromGrpc(err.metadata));
                e.methodName = method.name;
                e.serviceName = method.service.typeName;
                defHeader.rejectPending(e);
                defMessage.rejectPending(e);
                defStatus.rejectPending(e);
                defTrailer.rejectPending(e);
            }
        });
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('metadata', val => {
            defHeader.resolve(metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            // if we get a status (via trailer), but did not get a message,
            // we require that the status is an error status.
            if (defMessage.state === DeferredState.PENDING && val.code === GrpcStatus.OK) {
                const e = new RpcError('expected error status', GrpcStatus[GrpcStatus.DATA_LOSS]);
                e.methodName = method.name;
                e.serviceName = method.service.typeName;
                defMessage.rejectPending(e);
                defStatus.rejectPending(e);
                defTrailer.rejectPending(e);
            }
            else {
                defStatus.resolvePending({
                    code: GrpcStatus[val.code],
                    detail: val.details
                });
                defTrailer.resolvePending(metadataFromGrpc(val.metadata));
            }
        });
        return call;
    }
    serverStreaming(method, input, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new Deferred(), outStream = new RpcOutputStreamController(), defStatus = new Deferred(), defTrailer = new Deferred(), call = new ServerStreamingCall(method, meta, input, defHeader.promise, outStream, defStatus.promise, defTrailer.promise);
        const gCall = this.client.makeServerStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), input, gMeta, this.pickCallOptions(opt));
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('error', err => {
            const e = isServiceError(err) ? new RpcError(err.details, GrpcStatus[err.code], metadataFromGrpc(err.metadata)) : new RpcError(err.message);
            e.methodName = method.name;
            e.serviceName = method.service.typeName;
            defHeader.rejectPending(e);
            if (!outStream.closed) {
                outStream.notifyError(e);
            }
            defStatus.rejectPending(e);
            defTrailer.rejectPending(e);
        });
        gCall.addListener('end', () => {
            if (!outStream.closed) {
                outStream.notifyComplete();
            }
        });
        gCall.addListener('data', arg1 => {
            assert(method.O.is(arg1));
            outStream.notifyMessage(arg1);
        });
        gCall.addListener('metadata', val => {
            defHeader.resolve(metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: GrpcStatus[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(metadataFromGrpc(val.metadata));
        });
        return call;
    }
    clientStreaming(method, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new Deferred(), defMessage = new Deferred(), defStatus = new Deferred(), defTrailer = new Deferred(), gCall = this.client.makeClientStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), gMeta, this.pickCallOptions(opt), (err, value) => {
            if (value) {
                defMessage.resolve(value);
            }
            if (err) {
                const e = new RpcError(err.details, GrpcStatus[err.code], metadataFromGrpc(err.metadata));
                e.methodName = method.name;
                e.serviceName = method.service.typeName;
                defHeader.rejectPending(e);
                defMessage.rejectPending(e);
                defStatus.rejectPending(e);
                defTrailer.rejectPending(e);
            }
        }), inStream = new GrpcInputStreamWrapper(gCall), call = new ClientStreamingCall(method, meta, inStream, defHeader.promise, defMessage.promise, defStatus.promise, defTrailer.promise);
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('metadata', val => {
            defHeader.resolve(metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: GrpcStatus[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(metadataFromGrpc(val.metadata));
        });
        return call;
    }
    duplex(method, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new Deferred(), outStream = new RpcOutputStreamController(), defStatus = new Deferred(), defTrailer = new Deferred(), gCall = this.client.makeBidiStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), gMeta, this.pickCallOptions(opt)), inStream = new GrpcInputStreamWrapper(gCall), call = new DuplexStreamingCall(method, meta, inStream, defHeader.promise, outStream, defStatus.promise, defTrailer.promise);
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('error', err => {
            const e = isServiceError(err) ? new RpcError(err.details, GrpcStatus[err.code], metadataFromGrpc(err.metadata)) : new RpcError(err.message);
            e.methodName = method.name;
            e.serviceName = method.service.typeName;
            defHeader.rejectPending(e);
            if (!outStream.closed) {
                outStream.notifyError(e);
            }
            defStatus.rejectPending(e);
            defTrailer.rejectPending(e);
        });
        gCall.addListener('end', () => {
            if (!outStream.closed) {
                outStream.notifyComplete();
            }
        });
        gCall.addListener('data', arg1 => {
            assert(method.O.is(arg1));
            outStream.notifyMessage(arg1);
        });
        gCall.addListener('metadata', val => {
            defHeader.resolve(metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: GrpcStatus[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(metadataFromGrpc(val.metadata));
        });
        return call;
    }
    close() {
        this.client.close();
    }
}
class GrpcInputStreamWrapper {
    constructor(inner) {
        this.inner = inner;
    }
    send(message) {
        return new Promise((resolve, reject) => {
            this.inner.write(message, resolve);
            // this.inner.end(message, resolve);
        });
    }
    complete() {
        this.inner.end();
        return Promise.resolve(undefined);
    }
}
