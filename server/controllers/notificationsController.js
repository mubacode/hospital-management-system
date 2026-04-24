const db = require('../config/db');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get notifications from the database
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      message: notification.message,
      read: notification.is_read === 1,
      time: formatTimeAgo(notification.created_at),
      created_at: notification.created_at
    }));
    
    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if notification exists and belongs to user
    const [notifications] = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Update notification
    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ message: 'User ID and message are required' });
    }
    
    // Create notification
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)',
      [userId, message]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} mins ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay < 30) return `${diffDay} days ago`;
  
  return date.toLocaleDateString();
} 