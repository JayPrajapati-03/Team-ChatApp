import mongoose from "mongoose";

const channelMemberSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  joinedAt: {
    type: Date,
    default: Date.now,
  }
});

export const ChannelMember = mongoose.model("ChannelMember", channelMemberSchema);
