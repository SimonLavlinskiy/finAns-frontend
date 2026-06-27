import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "../src/features/projects/pages/ProjectsPage";

vi.mock("../src/lib/api", () => ({
  fetchProjects: vi.fn().mockResolvedValue({ data: [] }),
  fetchUsers: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1, username: "simon", display_name: "Simon" },
    projectId: null,
    setProjectId: vi.fn(),
  }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ProjectsPage", () => {
  it("пустое состояние: рендерится «У вас нет проектов» и кнопка «Создать проект»", async () => {
    render(
      <Wrapper>
        <ProjectsPage />
      </Wrapper>,
    );
    expect(await screen.findByText("У вас нет проектов")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Создать проект/i })).toBeTruthy();
  });
});
