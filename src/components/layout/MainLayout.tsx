import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useAudioCall } from "../../hooks/useAudioCall";
import AudioCallInterface from "../messaging/AudioCallInterface";
import VideoCallInterface from "../messaging/VideoCallInterface";
import FacebookVideoCallInterface from "../messaging/FacebookVideoCallInterface";

const MainLayout = () => {
  // Initialize WebRTC service globally for all users
  const {
    currentCall,
    isCallActive,
    isCallInterfaceOpen,
    answerCall,
    rejectCall,
    endCall,
    muteAudio,
    setSpeaker,
    toggleVideo,
    closeCallInterface,
  } = useAudioCall();

  return (
    <div>
      <Navbar />
      <Outlet />

      {/* Global Audio Call Interface */}
      {currentCall && isCallInterfaceOpen && currentCall.isVideo === false && (
        <AudioCallInterface
          isOpen={isCallInterfaceOpen}
          onClose={closeCallInterface}
          callData={currentCall}
          onAnswer={answerCall}
          onReject={rejectCall}
          onEnd={endCall}
          onMute={muteAudio}
          onSpeaker={setSpeaker}
        />
      )}

      {/* Global Video Call Interface - Facebook Style */}
      {currentCall && isCallInterfaceOpen && currentCall.isVideo === true && (
        <FacebookVideoCallInterface
          isOpen={isCallInterfaceOpen}
          onClose={closeCallInterface}
          callData={currentCall}
          onAnswer={answerCall}
          onReject={rejectCall}
          onEnd={endCall}
          onMute={muteAudio}
          onSpeaker={setSpeaker}
          onVideoToggle={toggleVideo}
        />
      )}
    </div>
  );
};

export default MainLayout;
