const db = require('../db');
const producer = require('../kafka');

// This can be either a lambda function which can be triggered using event bridge scheduler.

const BATCH_SIZE = 100;

const expireStories = async () => {
  try {
    console.log('Starting story expiry process...');
    
    while (true) {
      // Fetch a batch of unexpired, finalized stories older than 24 hrs
      const { rows: oldStories } = await db.query(
        `SELECT * FROM stories
         WHERE finalized = true
           AND created_at < NOW() - INTERVAL '24 HOURS'
           AND expired = false
         LIMIT $1`,
        [BATCH_SIZE]
      );

      if (oldStories.length === 0) {
        console.log('No stories to expire.');
        break;
      }

      const storyIds = oldStories.map(s => s.id);

      // Mark them as expired
      await db.query(
        `UPDATE stories
         SET expired = true
         WHERE id = ANY($1)`,
        [storyIds]
      );

      // Emit Kafka events
      const kafkaMessages = oldStories.map(story => ({
        key: story.id.toString(),
        value: JSON.stringify({
          storyId: story.id,
          userId: story.user_id,
          expiredAt: new Date().toISOString(),
        }),
      }));

      await producer.send({
        topic: 'story-expired',
        messages: kafkaMessages,
      });

      console.log(`Expired ${oldStories.length} stories...`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

module.exports = { expireStories };
