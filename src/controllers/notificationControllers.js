const Notification = require('../models/Notification');

const notificationControllers = {
    sendNotification: async ({
        senderId,
        receiverId,
        type,
        message
    }) => {
        try {
          const notification = new Notification({
            sender: senderId,
            receiver: receiverId,
            type: type,
            message: message
          })
          await notification.save();
        } catch (error) {
          throw new Error(error.message);
        }
      },
      getNotifications: async (req, res) => {
        try {
          const { userId } = req.params;
          const notifications = await Notification.find({ receiver: userId });
          return res.status(200).json(notifications);
        } catch (error) {
          return res.status(500).json({ message: error.message });
        }
      },
};

module.exports = notificationControllers;