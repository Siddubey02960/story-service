const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const storyController = require('./controller/story-controller')
const { invokeCron } = require('./cron-jobs/cron');

const PROTO_PATH = path.join(__dirname, '../protos/story.proto');

// Load proto file
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const storyProto = grpc.loadPackageDefinition(packageDefinition).user;

// gRPC service implemented here
const storyServiceImpl = {
  UploadStoryDraft: async (call, callback) => {
    try {
      const result = await storyController.uploadStoryDraft(call.request);
      callback(null, result);
    } catch (err) {
      console.log("Error while uploading story", err);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  FinalizeStory: async (call, callback) => {
    try {
      const result = await storyController.finalizeStory(call.request);
      callback(null, result);
    } catch (err) {
      console.log("Error while finalizinng story", err);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  GetStoriesFromFollowedUsers: async (call, callback) => {
    try {
      const result = await storyController.getStoriesFromFollowedUsers(call.request);
      callback(null, result);
    } catch (err) {
      console.log("Error while fetching stories", err);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  GetStoryViews: async (call, callback) => {
    try {
      const result = await storyController.getStoryViews(call.request);
      callback(null, result);
    } catch (err) {
      console.log("Error while stories views", err);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
  ReplyToStory: async (call, callback) => {
    try {
      const result = await storyController.replyToStory(call.request);
      callback(null, result);
    } catch (err) {
      console.log("Error while replying to story", err);
      callback({ code: grpc.status.INTERNAL, message: err.message });
    }
  },
};



// Start server
function main() {
  const server = new grpc.Server();
  server.addService(storyProto.UserService.service, storyServiceImpl);
  server.bind('0.0.0.0:5006', grpc.ServerCredentials.createInsecure());
  server.start();
  invokeCron();
  console.log('storyService gRPC server running on port 5006');
}

main();
