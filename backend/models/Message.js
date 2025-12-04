import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
    index: true
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

messageSchema.index({ channelId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
