import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/Store";
import { socketService } from "../services/socketService";

export const useSocket = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  const token = localStorage.getItem("access_token");
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect to WebSocket
      socketRef.current = socketService.connect(token);
    } else {
      // Disconnect if not authenticated
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  return {
    socket: socketService.getSocket(),
    isConnected: socketService.isSocketConnected(),
    onNewNotification: socketService.onNewNotification.bind(socketService),
    offNewNotification: socketService.offNewNotification.bind(socketService),
    onMessageNotification:
      socketService.onMessageNotification.bind(socketService),
    offMessageNotification:
      socketService.offMessageNotification.bind(socketService),
  };
};
