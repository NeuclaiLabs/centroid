import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CardTitle, CardDescription } from "@/components/ui/card";

interface TeamHeaderProps {
  team: any;
  isEditingTitle: boolean;
  isEditingDescription: boolean;
  tempTitle: string;
  tempDescription: string;
  setIsEditingTitle: (value: boolean) => void;
  setIsEditingDescription: (value: boolean) => void;
  setTempTitle: (value: string) => void;
  setTempDescription: (value: string) => void;
  handleTitleSubmit: () => void;
  handleDescriptionSubmit: () => void;
  handleKeyPress: (e: React.KeyboardEvent, submitFunction: () => void) => void;
}

export const TeamHeader = ({
  team,
  isEditingTitle,
  isEditingDescription,
  tempTitle,
  tempDescription,
  setIsEditingTitle,
  setIsEditingDescription,
  setTempTitle,
  setTempDescription,
  handleTitleSubmit,
  handleDescriptionSubmit,
  handleKeyPress,
}: TeamHeaderProps) => {
  return (
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
  );
};
