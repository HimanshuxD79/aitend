import Link from "next/link";
import { LogInIcon } from "lucide-react";
import {
  DefaultVideoPlaceholder,
  StreamVideoParticipant,
  ToggleVideoPreviewButton,
  ToggleAudioPreviewButton,
  VideoPreview,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { generateAvatarUri } from "@/lib/avatar";

import "@stream-io/video-react-sdk/dist/css/styles.css";
interface Props {
  onJoin: () => void;
}
const DisabledVideoPreview = () => {
  const { data } = authClient.useSession();
  return (
    <DefaultVideoPlaceholder
      participant={
        {
          name: data?.user.name ?? "",
          image:
            data?.user.image ??
            generateAvatarUri({ seed: data?.user.name, variant: "initials" }),
        } as StreamVideoParticipant
      }
    />
  );
};
const AllowedBrowserPermission = () => {
  return (
    <p className="text-sm">
      Please allow camera and microphone access to join the call.
    </p>
  );
};
export const CallLobby = ({ onJoin }: Props) => {
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const hasBrowserMediaPermission = hasMicPermission && hasCameraPermission;
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-8">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to join the call?
            </h1>
            <p className="text-gray-600">
              Check your camera and microphone settings before joining
            </p>
          </div>
          <VideoPreview
            DisabledVideoPreview={
              hasBrowserMediaPermission
                ? DisabledVideoPreview
                : AllowedBrowserPermission
            }
          />
          <div className=" justify-center flex gap-x-2 py-5">
            <ToggleVideoPreviewButton />
            <ToggleAudioPreviewButton />
          </div>
          <div className="flex gap-x-2 justify-between w-full">
            <Button asChild variant="ghost">
              <Link href="/meetings">Cancel</Link>
            </Button>
            <Button onClick={onJoin}>
              <LogInIcon />
              Join
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
