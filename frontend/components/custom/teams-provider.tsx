"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import useSWR from "swr";

import { fetcher } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string;
  // ... other team properties
}

interface TeamsContextType {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team) => void;
  isLoading: boolean;
  mutate: () => void;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

// Create a key for localStorage
const CURRENT_TEAM_KEY = "currentTeam";

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  const user = session?.user;

  const {
    data: teams = [],
    isLoading,
    mutate,
  } = useSWR<Team[]>(session?.user ? "/api/teams" : null, fetcher, {
    fallbackData: [],
  });

  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  // Modified useEffect to prioritize first team on initial load
  useEffect(() => {
    if (teams.length && !currentTeam) {
      const savedTeamId = localStorage.getItem(CURRENT_TEAM_KEY);
      const savedTeam = savedTeamId ? teams.find((team) => team.id === savedTeamId) : null;

      // If no saved team or saved team not found in current teams list, use first team
      const teamToSet = savedTeam || teams[0];

      if (teamToSet) {
        setCurrentTeam(teamToSet);
        localStorage.setItem(CURRENT_TEAM_KEY, teamToSet.id);
      }
    }
  }, [currentTeam, teams]);

  // Wrapper for setCurrentTeam that also saves to localStorage
  const handleSetCurrentTeam = (team: Team) => {
    setCurrentTeam(team);
    localStorage.setItem(CURRENT_TEAM_KEY, team.id);
  };

  return (
    <TeamsContext.Provider
      value={{
        teams,
        currentTeam,
        setCurrentTeam: handleSetCurrentTeam,
        isLoading,
        mutate,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error("useTeams must be used within a TeamsProvider");
  }
  return context;
}
