import { Server } from "socket.io";

let ioInstance = null;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  ioInstance.on("connection", (socket) => {
    // Client join room theo từng suất chiếu
    socket.on("join_showtime", ({ showtimeId }) => {
      if (!showtimeId) return;
      const room = `showtime_${showtimeId}`;
      socket.join(room);
    });

    socket.on("disconnect", () => {
      // Có thể log hoặc xử lý thêm nếu cần
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io chưa được khởi tạo");
  }
  return ioInstance;
};


