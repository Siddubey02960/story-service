const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'story-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}

connectProducer();

module.exports = producer;
