"use client";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Call,
  CallingState,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import { useTRPC } from "@/trpc/client";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { CallUI } from "./call-ui";
interface Props {
  meetingId: string;
  meetingName: string;
  userId: string;
  userName: string;
  userImage: string;
}
export const CallConnect = ({
  meetingId,
  meetingName,
  userId,
  userName,
  userImage,
}: Props) => {
  const trpc = useTRPC();
  const { mutateAsync: generateToken } = useMutation({
    ...trpc.meetings.generateToken.mutationOptions(),
    onError: (error) => {
      console.error("Failed to generate token:", error);
    },
    onSuccess: (token) => {
      console.log("Token generated successfully:", token);
    },
  });
  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    console.log("Creating Stream Video client...");
    console.log(
      "API Key available:",
      !!process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY
    );

    const _client = new StreamVideoClient({
      apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
      user: {
        id: userId,
        name: userName,
        image: userImage,
      },
      tokenProvider: generateToken,
    });
    console.log("Stream Video client created:", _client);
    setClient(_client);
    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, [userId, userName, userImage, generateToken]);
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    if (!client) return;
    console.log("Creating call instance for meeting:", meetingId);

    try {
      const _call = client.call("default", meetingId);
      _call.camera.disable();
      _call.microphone.disable();
      console.log("Call instance created:", _call);
      setCall(_call);

      return () => {
        if (_call.state.callingState != CallingState.LEFT) {
          _call.leave();
          _call.endCall();
          setCall(undefined);
        }
      };
    } catch (error) {
      console.error("Failed to create call instance:", error);
    }
  }, [client, meetingId]);
  if (!client || !call) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <LoaderIcon className="size-8 animate-spin text-white" />
      </div>
    );
  }
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI meetingName={meetingName} />
      </StreamCall>
    </StreamVideo>
  );
};
