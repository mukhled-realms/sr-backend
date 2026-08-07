const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const { router: authRoutes } = require('./routes/auth');
app.use('/api/auth', authRoutes);

// التعديل المهم هنا: لأننا نصدر دالة عادية، نستدعيها مباشرة ولا نفكها بـ { }
const setupGameSocket = require('./sockets/gameSocket');
setupGameSocket(io);

server.listen(process.env.PORT || 3000, () =>
  console.log('Skull Realms Server running')
);

module.exports.io = io;
