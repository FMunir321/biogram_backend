const messageModel = require('../models/messageModel');
const chatModel = require('../models/chatModels');
const userModel = require('../models/User');

const createMessage = async (req, res) => {
    const { chatId, senderId, text } = req.body;

    try {
        // Check if chat exists
        const chatExists = await chatModel.findById(chatId);
        if (!chatExists) {
            return res.status(400).json({ error: true, message: "Invalid chat ID" });
        }

        // Check if sender (user) exists
        const userExists = await userModel.findById(senderId);
        if (!userExists) {
            return res.status(400).json({ error: true, message: "Invalid sender ID" });
        }

        // Create and save message
        const message = new messageModel({ chatId, senderId, text });
        const response = await message.save();

        // Get socket.io instance and emit message to chat room
        const io = req.app.get('io');
        if (io) {
            console.log(`Emitting message to room ${chatId}:`, response);
            io.to(chatId).emit('getMessage', {
                _id: response._id,
                chatId: response.chatId,
                senderId: response.senderId,
                text: response.text,
                createdAt: response.createdAt
            });
        }

        return res.status(201).json(response);

    } catch (error) {
        console.error("Error creating message:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
};

const getMessages = async (req, res) => {
    const { chatId } = req.params;

    try {
        const messages = await messageModel.find({ chatId });
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({ error: true, message: "Internal server error" });
    }
}

module.exports = { createMessage, getMessages };