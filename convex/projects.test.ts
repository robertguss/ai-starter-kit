import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

const paginationOpts = { cursor: null, numItems: 10 } as const;

function testUsers() {
  const t = convexTest(schema, modules);
  return {
    t,
    owner: t.withIdentity({
      subject: "user_owner",
      tokenIdentifier: "https://clerk.example|user_owner",
    }),
    otherUser: t.withIdentity({
      subject: "user_other",
      tokenIdentifier: "https://clerk.example|user_other",
    }),
  };
}

describe("projects", () => {
  it("rejects every unauthenticated project operation", async () => {
    const { t, owner } = testUsers();
    const projectId = await owner.mutation(api.projects.create, {
      name: "Private",
      description: "Owner only",
    });

    await expect(
      t.query(api.projects.list, { paginationOpts }),
    ).rejects.toThrow("You must be signed in");
    await expect(
      t.mutation(api.projects.create, { name: "Private", description: "" }),
    ).rejects.toThrow("You must be signed in");
    await expect(t.query(api.projects.get, { projectId })).rejects.toThrow(
      "You must be signed in",
    );
    await expect(
      t.mutation(api.projects.update, {
        projectId,
        name: "Compromised",
        description: "",
      }),
    ).rejects.toThrow("You must be signed in");
    await expect(
      t.mutation(api.projects.remove, { projectId }),
    ).rejects.toThrow("You must be signed in");

    await expect(
      owner.query(api.projects.get, { projectId }),
    ).resolves.toMatchObject({ name: "Private" });
  });

  it("creates, reads, updates, and deletes a project", async () => {
    const { owner } = testUsers();
    const projectId = await owner.mutation(api.projects.create, {
      name: "  Customer portal  ",
      description: "  Production application  ",
    });

    const created = await owner.query(api.projects.get, { projectId });
    expect(created).toMatchObject({
      name: "Customer portal",
      description: "Production application",
      ownerId: "https://clerk.example|user_owner",
    });

    await owner.mutation(api.projects.update, {
      projectId,
      name: "Customer workspace",
      description: "Updated",
    });
    await expect(
      owner.query(api.projects.get, { projectId }),
    ).resolves.toMatchObject({
      name: "Customer workspace",
      description: "Updated",
    });

    await owner.mutation(api.projects.remove, { projectId });
    await expect(owner.query(api.projects.get, { projectId })).rejects.toThrow(
      "Project not found",
    );
  });

  it("returns only the authenticated owner's projects", async () => {
    const { owner, otherUser } = testUsers();

    await owner.mutation(api.projects.create, {
      name: "Owner project",
      description: "",
    });
    await otherUser.mutation(api.projects.create, {
      name: "Other project",
      description: "",
    });

    const ownerProjects = await owner.query(api.projects.list, {
      paginationOpts,
    });
    const otherProjects = await otherUser.query(api.projects.list, {
      paginationOpts,
    });

    expect(ownerProjects.page.map((project) => project.name)).toEqual([
      "Owner project",
    ]);
    expect(otherProjects.page.map((project) => project.name)).toEqual([
      "Other project",
    ]);
  });

  it("denies cross-user reads, updates, and deletes without revealing ownership", async () => {
    const { owner, otherUser } = testUsers();
    const projectId = await owner.mutation(api.projects.create, {
      name: "Owner project",
      description: "Sensitive",
    });

    await expect(
      otherUser.query(api.projects.get, { projectId }),
    ).rejects.toThrow("Project not found");
    await expect(
      otherUser.mutation(api.projects.update, {
        projectId,
        name: "Compromised",
        description: "",
      }),
    ).rejects.toThrow("Project not found");
    await expect(
      otherUser.mutation(api.projects.remove, { projectId }),
    ).rejects.toThrow("Project not found");

    await expect(
      owner.query(api.projects.get, { projectId }),
    ).resolves.toMatchObject({
      name: "Owner project",
      description: "Sensitive",
    });
  });

  it("validates and normalizes project input on the server", async () => {
    const { owner } = testUsers();

    await expect(
      owner.mutation(api.projects.create, { name: "   ", description: "" }),
    ).rejects.toThrow("Project name is required");
    await expect(
      owner.mutation(api.projects.create, {
        name: "x".repeat(101),
        description: "",
      }),
    ).rejects.toThrow("100 characters or fewer");
    await expect(
      owner.mutation(api.projects.create, {
        name: "Project",
        description: "x".repeat(2_001),
      }),
    ).rejects.toThrow("2,000 characters or fewer");
  });
});
