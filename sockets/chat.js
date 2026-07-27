module.exports = (io, socket) => {
  socket.on('chat_message', (data) => {
    io.emit('chat_message', {
      username: data.username,
      message: data.message,
      region: data.region || 'عالمي',
      timestamp: Date.now()
    });
  });
};
