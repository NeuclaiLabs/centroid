'use client'

import { ChevronDown, Pencil, Plus, UserPlus, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { fetcher } from '@/lib/utils';

const TeamPage = () => {
  const params = useParams();
  const teamId = params.id;
  const { data: members, mutate: mutateMembers } = useSWR(
    teamId ? `/api/teams/${teamId}/members` : null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const { data: team, isLoading, mutate: mutateTeam } = useSWR(
    teamId ? `/api/teams/${teamId}` : null,
    fetcher,
    {
      fallbackData: {},
    }
  );

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(team.name);
  const [tempDescription, setTempDescription] = useState(team.description);

  // Add this effect to update tempTitle and tempDescription when team data is loaded
  useEffect(() => {
    if (team) {
      setTempTitle(team.name);
      setTempDescription(team.description);
    }
  }, [team]);

  const [emailList, setEmailList] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEmail && !emailList.includes(currentEmail)) {
      setEmailList([...emailList, currentEmail]);
      setCurrentEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmailList(emailList.filter(email => email !== emailToRemove));
  };

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('members'); // Track active tab

  const roles = ["owner", "admin", "member"];

  const handleTitleSubmit = async () => {
    if (tempTitle === team.name) {
      setIsEditingTitle(false);
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: tempTitle }),
      });
      console.log("Response", response)
      mutateTeam({ ...team, name: tempTitle });
      setIsEditingTitle(false);
      toast.success('Team name updated successfully');
    } catch (error) {
      console.error('Error updating team name:', error);
      toast.error('Failed to update team name');
    }
  };

  const handleDescriptionSubmit = async () => {
    if (tempDescription === team.description) {
      setIsEditingDescription(false);
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify({ description: tempDescription }),
      });
      mutateTeam({ ...team, description: tempDescription });
      setIsEditingDescription(false);
      toast.success('Team description updated successfully');
    } catch (error) {
      console.error('Error updating team description:', error);
      toast.error('Failed to update team description');
    }
  };

  const handleInviteMember = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(emailList.map((email) => ({ email }))),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitations');
      }

      mutateMembers();
      setIsInviteDialogOpen(false);
      setEmailList([]);
      setCurrentEmail('');
      toast.success('Invitations sent successfully');
    } catch (error) {
      console.error('Error inviting members:', error);
      toast.error('Failed to send invitations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      mutateMembers();
      toast.success('Member role updated successfully');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, submitFunction: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitFunction();
    }
  };

  // Add these filters for members
  const acceptedMembers = members?.filter((member: any) =>
    member.invitation_status === 'accepted'
  ) || [];

  const pendingMembers = members?.filter((member: any) =>
    member.invitation_status === 'pending'
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="px-2 flex flex-col sm:flex-row justify-between items-start">
            <div className="space-y-4 w-full sm:w-auto">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-16 w-96" />
            </div>
            <div className="w-full sm:w-auto mt-4 sm:mt-0">
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>

          <CardContent className="px-2">
            <Skeleton className="h-10 w-48 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="size-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="border-none shadow-none">
        <CardHeader className="px-2 flex flex-col sm:flex-row justify-between items-start">
          <div className="space-y-4 w-full sm:w-auto">
            <div className="relative group">
              {isEditingTitle ? (
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => handleKeyPress(e, handleTitleSubmit)}
                  className="text-2xl font-bold p-1 w-full border-none max-w-full"
                  autoFocus
                  maxLength={100}
                  placeholder="Enter team name"
                />
              ) : (
                <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                  <CardTitle className="text-2xl font-bold">{team.name}</CardTitle>
                  <Pencil className="size-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            <div className="relative group">
              {isEditingDescription ? (
                <Textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onBlur={handleDescriptionSubmit}
                  onKeyDown={(e) => handleKeyPress(e, handleDescriptionSubmit)}
                  className="text-sm p-1 w-full resize-none border-none max-w-full break-words"
                  autoFocus
                  maxLength={500}
                  placeholder="Enter team description"
                />
              ) : (
                <div className="flex items-start group cursor-pointer" onClick={() => setIsEditingDescription(true)}>
                  <CardDescription className="text-sm break-words max-w-full">{team.description}</CardDescription>
                  <Pencil className="size-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto mt-4 sm:mt-0">
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <UserPlus className="size-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Members</DialogTitle>
                  <DialogDescription>Enter the email addresses of the people you'd like to invite.</DialogDescription>
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
                  <Button
                    onClick={handleInviteMember}
                    disabled={isSubmitting || emailList.length === 0}
                    className="w-full"
                  >
                    {isSubmitting ? 'Sending...' : `Invite ${emailList.length} ${emailList.length === 1 ? 'Member' : 'Members'}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="px-2">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="pendingInvites">Pending Invites</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <div className="space-y-2">
                {acceptedMembers.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={member.user?.avatar_url || `/api/placeholder/32/32`}
                          alt={member.user?.name}
                        />
                        <AvatarFallback className="text-xs">
                          {member.user?.name
                            ? member.user.name.split(' ').map((n: string) => n[0]).join('')
                            : 'UU'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-sm">{member.user?.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                      </div>
                    </div>
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
                              disabled={member.role === 'Owner'}
                              className={member.role === role ? 'bg-primary/5 font-medium' : ''}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pendingInvites">
              <div className="space-y-2">
                {pendingMembers.map((member: any) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {member.email?.charAt(0).toUpperCase() || 'UU'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-sm">{member.user?.name || 'Pending Member'}</h3>
                        <p className="text-sm text-muted-foreground">{member.user?.email || member.email}</p>
                      </div>
                    </div>
                    <p className="text-sm capitalize">{member.role}</p>
                  </div>
                ))}
                {pendingMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending invitations
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;
