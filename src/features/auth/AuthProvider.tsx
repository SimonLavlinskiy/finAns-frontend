import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUsers } from "@/lib/api";
import {
  clearSession,
  getActiveProjectId,
  getActiveUserId,
  setActiveProjectId,
  setActiveUserId,
} from "@/lib/session";
import type { User } from "@/lib/types";

type SessionContextValue = {
  user: User | null;
  projectId: number | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  setProjectId: (id: number) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const [activeUserId, setActiveUserIdState] = useState<number | null>(getActiveUserId);
  const [projectId, setProjectIdState] = useState<number | null>(getActiveProjectId);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await fetchUsers()).data,
    retry: false,
    staleTime: 60_000,
  });

  const user = users?.find((u) => u.id === activeUserId) ?? null;

  function setUser(u: User) {
    setActiveUserId(u.id);
    setActiveUserIdState(u.id);
  }

  function setProjectId(id: number) {
    setActiveProjectId(id);
    setProjectIdState(id);
    qc.clear();
  }

  function logout() {
    clearSession();
    setActiveUserIdState(null);
    setProjectIdState(null);
    qc.clear();
  }

  return (
    <SessionContext.Provider value={{ user, projectId, isLoading, setUser, setProjectId, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
