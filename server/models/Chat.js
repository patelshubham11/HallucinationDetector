import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  text: String,
  isFact: Boolean,
  confidence: Number,
  sources: [
    {
      title: String,
      link: String,
      snippet: String
    }
  ]
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  modelUsed: {
    type: String,
    enum: ['openai', 'gemini', 'openrouter'],
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  overallConfidence: {
    type: Number,
    default: 0
  },
  claims: [claimSchema],
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
