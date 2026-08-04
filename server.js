const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// الشات الحي والاتصال المباشر
io.on('connection', (socket) => {
  console.log('🟢 لاعب متصل:', socket.id);

  socket.on('chat_message', (data) => {
    io.emit('chat_message', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 لاعب انقطع:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Skull Realms يعمل بكفاءة على المنفذ ${PORT}`);
});
