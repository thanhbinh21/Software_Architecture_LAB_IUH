const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDef);

const server = new grpc.Server();

server.addService(proto.UserService.service, {
  GetUser: (_, cb) => {
    cb(null, { id: 1, name: 'Alice', email: 'alice@example.com' });
  }
});

server.bindAsync(
  '0.0.0.0:50051',
  grpc.ServerCredentials.createInsecure(),
  () => server.start()
);

console.log('gRPC running on 50051');
