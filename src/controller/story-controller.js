const db = require('../db/connection');
const producer = require('../kafka');

const uploadStoryDraft = async (call, callback) => {
  try {
    const { userId, mediaUrl, musicId, caption } = call.request;

    const { rows } = await db.query(
      `SELECT COUNT(*) FROM stories
       WHERE user_id = $1
         AND created_at::date = CURRENT_DATE
         AND finalized = true`,
      [userId]
    );
    const count = parseInt(rows[0].count, 10);
    if (count > 10) {
      return callback({
        code: grpc.status.RESOURCE_EXHAUSTED,
        message: 'Max 10 stories can be added in 1 day',
      });
    }

    const result = await db.query(
      `INSERT INTO stories (user_id, media_url, music_id, caption)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, mediaUrl, musicId, caption]
    );

    const story = result.rows[0];

    // Emit Kafka event
    await producer.send({
      topic: 'story-uploaded',
      messages: [
        {
          key: story.id.toString(),
          value: JSON.stringify({
            id: story.id,
            userId: story.user_id,
            mediaUrl: story.media_url,
            musicId: story.music_id,
            caption: story.caption,
            createdAt: story.created_at,
          }),
        },
      ],
    });

   return story;
  } catch (err) {
    console.error('UploadStoryDraft error:', err);
    callback(err);
  }
};

const finalizeStory = async (call, callback) => {
  try {
    const { storyId } = call.request;

    // Update story to finalized
    const result = await db.query(
      `UPDATE stories
       SET finalized = true
       WHERE id = $1
       RETURNING *`,
      [storyId]
    );

    const story = result.rows[0];

    if (!story) {
      return callback({
        code: 404, 
        message: 'Story not found',
      });
    }

    // Optional: Emit story-finalized Kafka event
    await producer.send({
      topic: 'story-finalized',
      messages: [
        {
          key: story.id.toString(),
          value: JSON.stringify({
            id: story.id,
            userId: story.user_id,
            finalized_time: new Date().toISOString(),
          }),
        },
      ],
    });

    return story;
  } catch (err) {
    console.error('FinalizeStory error:', err);
    callback(err);
  }
};

const getStoriesFromFollowedUsers = async (call, callback) => {
  const { userId, page_size = 20, page_number = 0 } = call.request;

  try {
    const result = await db.query(
      `SELECT s.* 
       FROM followers f
       JOIN stories s ON s.user_id = f.followed_user_id
       WHERE f.user_id = $1
         AND s.finalized = TRUE
         AND s.created_at >= NOW() - INTERVAL '24 HOURS'
       ORDER BY s.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, page_size, page_number]
    );

    let stories = result.rows || [] 

    const countResult = await db.query(
      `SELECT COUNT(*) AS count
       FROM followers f
       JOIN stories s ON s.user_id = f.followed_user_id
       WHERE f.user_id = $1
         AND s.is_final = TRUE
         AND s.created_at >= NOW() - INTERVAL '24 HOURS'`,
      [userId]
    );

    const totalCount = parseInt(countResult.rows[0].count, 10);

    return { stories, totalCount };
  } catch (err) {
    console.error('Error while fetching stories:', err);
    callback(err);
  }
};


const getStoryViews = async (call, callback) => {
  const { storyId, page_size, page_number } = call.request;

  try {
    // 1. Get total count of viewers
    const countResult = await db.query(
      `SELECT COUNT(*) FROM story_views WHERE story_id = $1`,
      [storyId]
    );
    const totalCount = countResult.rows[0].count;

    // 2. Get paginated viewers
    const result = await db.query(
      `SELECT viewer_id, viewed_at
       FROM story_views
       WHERE story_id = $1
       ORDER BY viewed_at DESC
       LIMIT $2 OFFSET $3`,
      [storyId, page_size, page_number]
    );

    const viewers = result.rows.map(v => ({
      userId: v.viewer_id.toString(),
      viewedAt: v.viewed_at.toISOString(),
    }));

    return { viewers, totalCount };
  } catch (err) {
    console.error('GetStoryViews error:', err);
    callback(err);
  }
};


const replyToStory = async (call, callback) => {
  try {
    const { storyId, fromUserId, message } = call.request;

    const result = await db.query(
      `INSERT INTO story_replies (story_id, from_user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [storyId, fromUserId, message]
    );

    const reply = result.rows[0];

    // Emit Kafka event
    await producer.send({
      topic: 'story-replied',
      messages: [
        {
          key: storyId.toString(),
          value: JSON.stringify({
            replyId: reply.id,
            storyId: reply.story_id,
            fromUserId: reply.from_user_id,
            message: reply.message,
            createdAt: reply.created_at,
          }),
        },
      ],
    });

    return reply;

  } catch (err) {
    console.error('ReplyToStory error:', err);
    callback(err);
  }
};

module.exports = {
  uploadStoryDraft,
  finalizeStory,
  getStoriesFromFollowedUsers,
  getStoryViews,
  replyToStory
};
