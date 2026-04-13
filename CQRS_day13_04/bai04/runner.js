const { EventBus } = require("./shared/eventBus");
const startCommandService = require("./command-service/api");
const startQueryService = require("./query-service/api");

const COMMAND_PORT = 3004;
const QUERY_PORT = 3005;

console.log("Starting Microservices for CQRS...");

// 1. Initialize the fake "Message Broker" (Kafka/RabbitMQ equivalent)
const eventBus = new EventBus();

// 2. Start the Command Service on Port 3004
// The Command Service will publish to eventBus
startCommandService(eventBus, COMMAND_PORT);

// 3. Start the Query Service on Port 3005
// The Query Service has subscribed to eventBus to build its Read Model
startQueryService(eventBus, QUERY_PORT);

console.log(`\nServices Started! Open http://localhost:${QUERY_PORT} to test the UI.`);
