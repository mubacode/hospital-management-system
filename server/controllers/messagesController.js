const db = require('../config/db');

// Get all messages for a user
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get messages from the database
    const [messages] = await db.query(
      `SELECT m.*, 
        CASE 
          WHEN m.sender_id = ? THEN 'outbox' 
          ELSE 'inbox' 
        END AS type,
        COALESCE(sender.username, 'System') as sender_username,
        COALESCE(sender_doctor.first_name, sender_patient.first_name, '') as sender_first_name,
        COALESCE(sender_doctor.last_name, sender_patient.last_name, '') as sender_last_name
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN doctors sender_doctor ON sender.id = sender_doctor.user_id
      LEFT JOIN patients sender_patient ON sender.id = sender_patient.user_id
      WHERE m.recipient_id = ? OR m.sender_id = ?
      ORDER BY m.created_at DESC`,
      [userId, userId, userId]
    );
    
    // Format messages for frontend
    const formattedMessages = messages.map(message => {
      let fromName = message.sender_username;
      
      // If sender has first/last name, use them
      if (message.sender_first_name && message.sender_last_name) {
        fromName = `${message.sender_first_name} ${message.sender_last_name}`;
      }
      
      return {
        id: message.id,
        from: fromName,
        subject: message.subject,
        content: message.content,
        read: message.is_read === 1,
        time: formatTimeAgo(message.created_at),
        created_at: message.created_at,
        type: message.type
      };
    });
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if message exists and belongs to user
    const [messages] = await db.query(
      'SELECT * FROM messages WHERE id = ? AND recipient_id = ?',
      [id, userId]
    );
    
    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Update message
    await db.query(
      'UPDATE messages SET is_read = 1 WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { recipientId, subject, content } = req.body;
    const senderId = req.user.id;
    
    if (!recipientId || !subject || !content) {
      return res.status(400).json({ message: 'Recipient ID, subject and content are required' });
    }
    
    // Create message
    const [result] = await db.query(
      'INSERT INTO messages (sender_id, recipient_id, subject, content, is_read) VALUES (?, ?, ?, ?, 0)',
      [senderId, recipientId, subject, content]
    );
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
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