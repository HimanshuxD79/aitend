"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
interface ResponsiveDialogProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const ResponsiveDialog = ({
  title,
  children,
  description,
  open,
  onOpenChange,
}: ResponsiveDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {/* <DrawerTrigger asChild>
          <button className="btn">Open Dialog</button>
        </DrawerTrigger> */}
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {/* {description && ( */}
            <DialogDescription>{description}</DialogDescription>
            {/* )} */}
          </DrawerHeader>
          <div className="p-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* {description && ( */}
          <DialogDescription>{description}</DialogDescription>
          {/* )} */}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};
