import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
export const DashboardUserButton = () => {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  if (isPending || !data?.user) {
    return null;
  }
  const handleLogout = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg border border-transparent bg-sidebar-accent p-2 hover:bg-sidebar-accent/50">
        <button className="flex items-center gap-2 px-2 py-1 text-sm font-medium">
          <span className="text-sidebar-accent-foreground">
            {data?.user?.name}
            <br />
            <span className="text-xs text-sidebar-accent-foreground/70">
              {data?.user?.email}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>User Menu</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
