const cron = require('node-cron');
const { expireStories } = require('./expire-stories');

cron.schedule('*/5 * * * *', async () => {
  console.log('Running story expiry job');
  await expireStories();
});
