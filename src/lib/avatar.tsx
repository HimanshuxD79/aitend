import { createAvatar } from "@dicebear/core";
import * as bottts from "@dicebear/bottts";
import * as initials from "@dicebear/initials";

interface Props {
  seed: string;
  variant: "bottts" | "initials";
}
export const generateAvatarUri = ({ seed, variant }: Props) => {
  let avatar;
  if (variant === "bottts") {
    avatar = createAvatar(bottts, {
      seed,
      size: 64,
    });
  } else if (variant === "initials") {
    avatar = createAvatar(initials, {
      seed,
      size: 64,
    });
  }

  if (!avatar) {
    throw new Error("Failed to create avatar");
  }

  return avatar.toDataUri();
};
