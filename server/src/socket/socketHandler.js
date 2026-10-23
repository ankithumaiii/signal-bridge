export const initSocket = (io) => {
  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation_${conversationId}`);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Heartbeat
    socket.on('heartbeat', (data) => {
      socket.emit('heartbeat_ack', {
        serverTime: Date.now(),
        clientTime: data?.time
      });
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });
};
