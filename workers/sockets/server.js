
const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a shared room for two users
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", {
      userId: socket.id,
    });
  });

  // Send a message to other users in the same room
  socket.on("send-message", ({ roomId, message }) => {
    socket.to(roomId).emit("receive-message", {
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

console.log("Socket.IO server running on port 3001");
