import mongoose from "mongoose";
import { Channel } from "../models/Channel.js";
import { ChannelMember } from "../models/ChannelMember.js";
import { Message } from "../models/Message.js";

// CREATE CHANNEL
export const createChannel = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name)
      return res.status(400).json({ message: "Channel name is required" });

    const exists = await Channel.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Channel already exists" });

    const channel = new Channel({
      name,
      createdBy: req.user.id
    });

    await channel.save();

    // Auto-join the creator
    await ChannelMember.create({
      channelId: channel._id,
      userId: req.user.id
    });

    res.status(201).json({ message: "Channel created", channel });

  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// GET ALL CHANNELS
export const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find().sort({ createdAt: -1 });
    res.status(200).json({ channels });

  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// JOIN CHANNEL
export const joinChannel = async (req, res) => {
  try {
    const { channelId } = req.body;

    if (!channelId)
      return res.status(400).json({ message: "Channel ID is required" });

    if (!mongoose.Types.ObjectId.isValid(channelId))
      return res.status(400).json({ message: "Invalid channel ID format" });

    const channel = await Channel.findById(channelId);
    if (!channel)
      return res.status(404).json({ message: "Channel not found" });

    const exists = await ChannelMember.findOne({
      channelId,
      userId: req.user.id
    });

    if (exists)
      return res.status(200).json({ message: "Already a member" });

    await ChannelMember.create({
      channelId,
      userId: req.user.id
    });

    res.status(200).json({ message: "Joined channel" });

  } catch (error) {
    console.error("Join channel error:", error);
    res.status(500).json({ message: "Error joining channel", error: error.message });
  }
};

// LEAVE CHANNEL
export const leaveChannel = async (req, res) => {
  try {
    const { channelId } = req.body;

    await ChannelMember.findOneAndDelete({
      channelId,
      userId: req.user.id
    });

    res.status(200).json({ message: "Left channel" });

  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// GET CHANNEL MEMBERS
export const getChannelMembers = async (req, res) => {
  try {
    const { channelId } = req.params;

    const members = await ChannelMember.find({ channelId })
      .populate("userId", "username email");

    res.status(200).json({ members });

  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// UPDATE (RENAME) CHANNEL
export const updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: "Invalid channel ID" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "New name is required" });
    }

    // Optional: prevent duplicate channel names
    const nameExists = await Channel.findOne({ name: name.trim() });
    if (nameExists && nameExists._id.toString() !== channelId) {
      return res.status(400).json({ message: "Another channel with this name already exists" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    channel.name = name.trim();
    await channel.save();

    // Return the updated channel
    res.status(200).json({ message: "Channel renamed", channel });

  } catch (error) {
    console.error("Update channel error:", error);
    res.status(500).json({ message: "Error updating channel", error: error.message });
  }
};

// DELETE CHANNEL
export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: "Invalid channel ID" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // ❗ Creator check REMOVED — anyone can delete
    await Channel.findByIdAndDelete(channelId);

    // Delete all messages for this channel
    await Message.deleteMany({ channelId });

    // Delete all members
    await ChannelMember.deleteMany({ channelId });

    res.status(200).json({ message: "Channel deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error deleting channel", error: error.message });
  }
};
