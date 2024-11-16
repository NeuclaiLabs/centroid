"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import useSWR from "swr";

import { fetcher, getToken } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string;
  // ... other team properties
}

interface TeamsContextType {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string) => void;
  mutateTeams: () => void;
  isLoading: boolean;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

// Create a key for localStorage
const CURRENT_TEAM_KEY = "currentTeam";

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  // 1. More specific cache key with API URL
  const {
    data: { data: teams = [], count },
    isLoading,
    mutate: mutateTeams,  // Renamed for clarity
  } = useSWR(
    session?.user
      ? [`${process.env.NEXT_PUBLIC_BACKEND_HOST}/api/v1/teams/`, getToken(session)]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      fallbackData: [],
    }
  );

  // 3. Separate selected team ID from team data
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // 4. Modified useEffect to handle team selection
  useEffect(() => {
    if (teams.length && !selectedTeamId) {
      const savedTeamId = localStorage.getItem(CURRENT_TEAM_KEY);
      const validTeamId = savedTeamId && teams.some((team: Team) => team.id === savedTeamId)
        ? savedTeamId
        : teams[0].id;

      setSelectedTeamId(validTeamId);
      localStorage.setItem(CURRENT_TEAM_KEY, validTeamId);
    }
  }, [teams, selectedTeamId]);

  // 5. Simplified team selection handler
  const handleTeamSelection = (teamId: string) => {
    setSelectedTeamId(teamId);
    localStorage.setItem(CURRENT_TEAM_KEY, teamId);
  };

  // 6. More focused context value
  return (
    <TeamsContext.Provider
      value={{
        teams,
        selectedTeamId,
        setSelectedTeamId: handleTeamSelection,
        mutateTeams,
        isLoading,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
}

// 7. Updated interface to match new structure
interface TeamsContextType {
  teams: Team[];
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string) => void;
  mutateTeams: () => void;
  isLoading: boolean;
}

// 8. Updated hook with better error message
export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error("useTeams must be used within a TeamsProvider. Please check your component hierarchy.");
  }
  return context;
}
