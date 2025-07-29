const chatModel = require('../models/chatModels');

const createChat = async (req, res) => {
    const { firstId, secondId } = req.body;
    try {
        const chat = await chatModel.findOne({
            members: { $all: [firstId, secondId] }
        });

        if (chat) {
            return res.status(200).json(chat);
        }

        const newChat = new chatModel({
            members: [firstId, secondId]
        });

        const response = await newChat.save();
        return res.status(201).json(response);

    } catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
}

const findUserChats = async (req, res) => {
    const { userId } = req.params;
    try {
        const chats = await chatModel.find({
            members: { $in: [userId] }
        });

        return res.status(200).json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
}

const findChat = async (req, res) => {
    const { firstId, secondId } = req.params;
    try {
        const chat = await chatModel.findOne({
            members: { $all: [firstId, secondId] }
        });

        if (!chat) {
            return res.status(404).json({ error: true, message: "Chat not found" });
        }

        return res.status(200).json(chat);
    } catch (error) {
        console.error("Error finding chat:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
}

module.exports = { createChat, findUserChats, findChat };