import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";
interface Props {
  meetingName: string;
}
export const CallUI = ({ meetingName }: Props) => {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
  const handleJoin = async () => {
    if (!call) {
      console.error("No call instance available");
      return;
    }

    try {
      console.log("Attempting to join call...");
      await call.join();
      console.log("Successfully joined call");
      setShow("call");
    } catch (error) {
      console.error("Failed to join call:", error);
      // You might want to show a toast or error message here
    }
  };
  const handleLeave = () => {
    if (!call) return;
    call.endCall();
    setShow("ended");
  };
  return (
    <StreamTheme className="h-screen w-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && (
        <CallActive onLeave={handleLeave} meetingName={meetingName} />
      )}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};
