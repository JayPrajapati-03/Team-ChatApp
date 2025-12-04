import { Message } from "../models/Message.js";

export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    // Fetch newest first 
    let rawMessages = await Message.find({ channelId })
      .sort({ createdAt: -1 })   
      .skip(skip)
      .limit(limit)
      .populate("senderId", "username email");

    // Transform to match socket message format
    const messages = rawMessages.reverse().map(msg => ({
      _id: msg._id,
      channelId: msg.channelId,
      sender: {
        _id: msg.senderId._id,
        username: msg.senderId.username
      },
      text: msg.text,
      createdAt: msg.createdAt
    }));

    const total = await Message.countDocuments({ channelId });

    res.status(200).json({
      messages,
      page,
      limit,
      total,
      hasMore: skip + rawMessages.length < total
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};
