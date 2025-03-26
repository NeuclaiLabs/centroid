import { Plus, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface InviteMemberDialogProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  emailList: string[];
  currentEmail: string;
  setCurrentEmail: (value: string) => void;
  handleAddEmail: (e: React.FormEvent) => void;
  removeEmail: (email: string) => void;
  handleInviteMember: () => void;
  isSubmitting: boolean;
}

export const InviteMemberDialog = ({
  isOpen,
  setIsOpen,
  emailList,
  currentEmail,
  setCurrentEmail,
  handleAddEmail,
  removeEmail,
  handleInviteMember,
  isSubmitting,
}: InviteMemberDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <UserPlus className="size-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>Enter the email addresses of the people you want to invite.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddEmail} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email Address"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
            />
            <Button type="submit" variant="outline" size="icon">
              <Plus className="size-4" />
            </Button>
          </div>
        </form>

        <div className="mt-4">
          {emailList.map((email) => (
            <div key={email} className="flex items-center justify-between py-2">
              <span className="text-sm">{email}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEmail(email)}
                className="h-auto p-1 text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={handleInviteMember} disabled={isSubmitting || emailList.length === 0} className="w-full">
            {isSubmitting
              ? "Sending..."
              : `Invite ${emailList.length} ${emailList.length === 1 ? "Member" : "Members"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
