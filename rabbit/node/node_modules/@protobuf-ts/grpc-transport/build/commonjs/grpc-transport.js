"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcTransport = void 0;
const runtime_rpc_1 = require("@protobuf-ts/runtime-rpc");
const grpc_js_1 = require("@grpc/grpc-js");
const runtime_1 = require("@protobuf-ts/runtime");
const util_1 = require("./util");
class GrpcTransport {
    constructor(defaultOptions) {
        this.defaultOptions = defaultOptions;
        this.client = new grpc_js_1.Client(defaultOptions.host, defaultOptions.channelCredentials, defaultOptions.clientOptions);
    }
    mergeOptions(options) {
        return runtime_rpc_1.mergeRpcOptions(this.defaultOptions, options);
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
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = util_1.metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new runtime_rpc_1.Deferred(), defMessage = new runtime_rpc_1.Deferred(), defStatus = new runtime_rpc_1.Deferred(), defTrailer = new runtime_rpc_1.Deferred(), call = new runtime_rpc_1.UnaryCall(method, meta, input, defHeader.promise, defMessage.promise, defStatus.promise, defTrailer.promise);
        const gCall = this.client.makeUnaryRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), input, gMeta, this.pickCallOptions(opt), (err, value) => {
            if (value) {
                defMessage.resolve(value);
            }
            if (err) {
                const e = new runtime_rpc_1.RpcError(err.details, grpc_js_1.status[err.code], util_1.metadataFromGrpc(err.metadata));
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
            defHeader.resolve(util_1.metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            // if we get a status (via trailer), but did not get a message,
            // we require that the status is an error status.
            if (defMessage.state === runtime_rpc_1.DeferredState.PENDING && val.code === grpc_js_1.status.OK) {
                const e = new runtime_rpc_1.RpcError('expected error status', grpc_js_1.status[grpc_js_1.status.DATA_LOSS]);
                e.methodName = method.name;
                e.serviceName = method.service.typeName;
                defMessage.rejectPending(e);
                defStatus.rejectPending(e);
                defTrailer.rejectPending(e);
            }
            else {
                defStatus.resolvePending({
                    code: grpc_js_1.status[val.code],
                    detail: val.details
                });
                defTrailer.resolvePending(util_1.metadataFromGrpc(val.metadata));
            }
        });
        return call;
    }
    serverStreaming(method, input, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = util_1.metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new runtime_rpc_1.Deferred(), outStream = new runtime_rpc_1.RpcOutputStreamController(), defStatus = new runtime_rpc_1.Deferred(), defTrailer = new runtime_rpc_1.Deferred(), call = new runtime_rpc_1.ServerStreamingCall(method, meta, input, defHeader.promise, outStream, defStatus.promise, defTrailer.promise);
        const gCall = this.client.makeServerStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), input, gMeta, this.pickCallOptions(opt));
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('error', err => {
            const e = util_1.isServiceError(err) ? new runtime_rpc_1.RpcError(err.details, grpc_js_1.status[err.code], util_1.metadataFromGrpc(err.metadata)) : new runtime_rpc_1.RpcError(err.message);
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
            runtime_1.assert(method.O.is(arg1));
            outStream.notifyMessage(arg1);
        });
        gCall.addListener('metadata', val => {
            defHeader.resolve(util_1.metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: grpc_js_1.status[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(util_1.metadataFromGrpc(val.metadata));
        });
        return call;
    }
    clientStreaming(method, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = util_1.metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new runtime_rpc_1.Deferred(), defMessage = new runtime_rpc_1.Deferred(), defStatus = new runtime_rpc_1.Deferred(), defTrailer = new runtime_rpc_1.Deferred(), gCall = this.client.makeClientStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), gMeta, this.pickCallOptions(opt), (err, value) => {
            if (value) {
                defMessage.resolve(value);
            }
            if (err) {
                const e = new runtime_rpc_1.RpcError(err.details, grpc_js_1.status[err.code], util_1.metadataFromGrpc(err.metadata));
                e.methodName = method.name;
                e.serviceName = method.service.typeName;
                defHeader.rejectPending(e);
                defMessage.rejectPending(e);
                defStatus.rejectPending(e);
                defTrailer.rejectPending(e);
            }
        }), inStream = new GrpcInputStreamWrapper(gCall), call = new runtime_rpc_1.ClientStreamingCall(method, meta, inStream, defHeader.promise, defMessage.promise, defStatus.promise, defTrailer.promise);
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('metadata', val => {
            defHeader.resolve(util_1.metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: grpc_js_1.status[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(util_1.metadataFromGrpc(val.metadata));
        });
        return call;
    }
    duplex(method, options) {
        var _a;
        const opt = options, meta = (_a = opt.meta) !== null && _a !== void 0 ? _a : {}, gMeta = util_1.metadataToGrpc(meta, opt.metadataOptions, method.idempotency === "IDEMPOTENT"), defHeader = new runtime_rpc_1.Deferred(), outStream = new runtime_rpc_1.RpcOutputStreamController(), defStatus = new runtime_rpc_1.Deferred(), defTrailer = new runtime_rpc_1.Deferred(), gCall = this.client.makeBidiStreamRequest(`/${method.service.typeName}/${method.name}`, (value) => Buffer.from(method.I.toBinary(value, opt.binaryOptions)), (value) => method.O.fromBinary(value, opt.binaryOptions), gMeta, this.pickCallOptions(opt)), inStream = new GrpcInputStreamWrapper(gCall), call = new runtime_rpc_1.DuplexStreamingCall(method, meta, inStream, defHeader.promise, outStream, defStatus.promise, defTrailer.promise);
        if (opt.abort) {
            opt.abort.addEventListener('abort', ev => {
                gCall.cancel();
            });
        }
        gCall.addListener('error', err => {
            const e = util_1.isServiceError(err) ? new runtime_rpc_1.RpcError(err.details, grpc_js_1.status[err.code], util_1.metadataFromGrpc(err.metadata)) : new runtime_rpc_1.RpcError(err.message);
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
            runtime_1.assert(method.O.is(arg1));
            outStream.notifyMessage(arg1);
        });
        gCall.addListener('metadata', val => {
            defHeader.resolve(util_1.metadataFromGrpc(val));
        });
        gCall.addListener('status', val => {
            defStatus.resolvePending({
                code: grpc_js_1.status[val.code],
                detail: val.details
            });
            defTrailer.resolvePending(util_1.metadataFromGrpc(val.metadata));
        });
        return call;
    }
    close() {
        this.client.close();
    }
}
exports.GrpcTransport = GrpcTransport;
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
