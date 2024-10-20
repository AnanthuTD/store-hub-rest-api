import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageTimestamp: { type: Date, default: Date.now },
});

const ConversationModel = mongoose.model('Conversation', ConversationSchema);

export default ConversationModel;
