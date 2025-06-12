const cron = require('node-cron');
const { expireStories } = require('./expire-stories');

function invokeCron(){
    cron.schedule('*/5 * * * *', async () => {
        console.log('Running story expiry job');
        await expireStories();
      });
}

module.exports = { invokeCron };
