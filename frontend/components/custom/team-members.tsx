import { ChevronDown } from "lucide-react";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  user_id: string;
  role: string;
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  email?: string;
  invitation_status?: string;
}

interface MembersListProps {
  members: Member[];
  roles: string[];
  handleRoleChange: (userId: string, newRole: string) => void;
  isPending?: boolean;
}

export const MembersList = ({ members, roles, handleRoleChange, isPending = false }: MembersListProps) => {
  if (members.length === 0 && isPending) {
    return <div className="text-sm text-muted-foreground text-center py-4">No pending invitations</div>;
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <Avatar className="size-8">
              {!isPending ? (
                <AvatarImage src={member.user?.avatar_url || `/api/placeholder/32/32`} alt={member.user?.name} />
              ) : null}
              <AvatarFallback className="text-xs">
                {isPending
                  ? member.email?.charAt(0).toUpperCase() || "UU"
                  : member.user?.name
                    ? member.user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                    : "UU"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm">
                {isPending ? member.user?.name || "Pending Member" : member.user?.name}
              </h3>
              <p className="text-sm text-muted-foreground">{member.user?.email || member.email}</p>
            </div>
          </div>

          {!isPending ? (
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1 text-sm font-normal hover:bg-primary/5"
                  >
                    <span>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                    <ChevronDown className="size-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {roles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleChange(member.user_id, role)}
                      disabled={member.role === "owner"}
                      className={member.role === role ? "bg-primary/5 font-medium" : ""}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <p className="text-sm capitalize">{member.role}</p>
          )}
        </div>
      ))}
    </div>
  );
};
