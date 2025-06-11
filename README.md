## story-service

# setupis same as in user service

# uploadStory

grpcurl -plaintext -d '{
  "userId": "1",
  "mediaUrl": "https://example.com/story1.jpg",
  "musicId": "m123",
  "caption": "My first story!"
}' localhost:5006 story.StoryService/UploadStoryDraft

{
  "story": {
    "id": "7",
    "userId": "1",
    "mediaUrl": "https://example.com/story1.jpg",
    "musicId": "m123",
    "caption": "My first story!",
    "isFinal": false,
    "createdAt": "2025-06-10T23:45:12.123Z"
  }
}


# finalizeStory

grpcurl -plaintext -d '{"storyId": "7"}' \
  localhost:5006 story.StoryService/FinalizeStory

{
  "story": {
    "id": "7",
    "userId": "1",
    "mediaUrl": "https://example.com/story1.jpg",
    "musicId": "m123",
    "caption": "My first story!",
    "isFinal": true,
    "createdAt": "2025-06-10T23:45:12.123Z"
  }
}

# getStories

grpcurl -plaintext -d '{"userId": "1", "page_number": 1, "page_size": 15}' \
  localhost:5006 story.StoryService/GetStoriesFromFollowedUsers


  {
  "stories": [
    {
      "id": "9",
      "userId": "2",
      "mediaUrl": "https://example.com/story2.jpg",
      "musicId": "abc",
      "caption": "Vacation!",
      "isFinal": true,
      "createdAt": "2025-06-10T21:30:00.000Z"
    }
  ]
}


# getStoryView

grpcurl -plaintext -d '{"storyId": "9"}' \
  localhost:5006 story.StoryService/GetStoryViews


  {
  "viewers": [
    {
      "userId": "3",
      "viewedAt": "2025-06-10T22:55:00.000Z"
    },
    {
      "userId": "2",
      "viewedAt": "2025-06-10T23:02:00.000Z"
    }
  ]
}


# replyToStory

grpcurl -plaintext -d '{
  "storyId": "9",
  "fromUserId": "3",
  "message": "Haha, awesome!"
}' localhost:50052 story.StoryService/ReplyToStory


{
  "reply": {
    "id": "5",
    "storyId": "9",
    "fromUserId": "3",
    "message": "Haha, awesome!",
    "createdAt": "2025-06-10T23:59:00.000Z"
  }
}










