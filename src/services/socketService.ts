import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string): Socket {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    this.socket = io(backendUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Listen for new notifications
  onNewNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.on("new_notification", callback);
    }
  }

  // Remove notification listener
  offNewNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.off("new_notification", callback);
    }
  }

  // Listen for message notifications
  onMessageNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.on("message_notification", callback);
    }
  }

  // Remove message notification listener
  offMessageNotification(callback: (notification: any) => void): void {
    if (this.socket) {
      this.socket.off("message_notification", callback);
    }
  }
}

export const socketService = new SocketService();
