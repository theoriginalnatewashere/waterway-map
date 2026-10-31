import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  error: vi.fn(),
  writes: [] as string[],
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: mocks.getUser,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }),
      update: ({ language }: { language: string }) => ({
        eq: () => ({
          select: () => ({
            single: () => {
              mocks.writes.push(language);
              return mocks.write(language);
            },
          }),
        }),
      }),
    }),
  },
}));
import { LanguageProvider, useLanguage } from "@/i18n/LanguageProvider";
import { LANGUAGE_STORAGE_KEY, storeLanguage } from "@/i18n";

function Controls() {
  const { language, setLanguage } = useLanguage();
  return (
    <>
      <output aria-label="language">{language}</output>
      <button onClick={() => setLanguage("th")}>Thai</button>
      <button onClick={() => setLanguage("en")}>English</button>
    </>
  );
}
function setup() {
  return render(
    <LanguageProvider>
      <Controls />
    </LanguageProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.writes.length = 0;
  localStorage.clear();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mocks.read.mockResolvedValue({ data: { language: "en" }, error: null });
  mocks.write.mockImplementation(async (language) => ({ data: { language }, error: null }));
});
describe("language persistence", () => {
  it("saves Thai to the account and restores it on remount", async () => {
    const view = setup();
    await waitFor(() => expect(mocks.read).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Thai"));
    await waitFor(() => expect(mocks.writes).toEqual(["th"]));
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("th");
    view.unmount();
    mocks.read.mockResolvedValue({ data: { language: "th" }, error: null });
    setup();
    await waitFor(() => expect(screen.getByLabelText("language")).toHaveTextContent("th"));
  });
  it("surfaces returned database errors and keeps the local choice", async () => {
    mocks.write.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    setup();
    await waitFor(() => expect(mocks.read).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Thai"));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("th");
  });
  it("treats a missing profile as a failed save", async () => {
    mocks.write.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    setup();
    await waitFor(() => expect(mocks.read).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Thai"));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledTimes(1));
  });
  it("serializes choices and ignores stale profile reads", async () => {
    let resolveRead: (value: unknown) => void = () => {};
    mocks.read.mockReturnValue(
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
    );
    let resolveWrite: (value: unknown) => void = () => {};
    mocks.write.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveWrite = resolve;
        }),
    );
    setup();
    await waitFor(() => expect(mocks.read).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Thai"));
    await waitFor(() => expect(mocks.writes).toEqual(["th"]));
    fireEvent.click(screen.getByText("English"));
    expect(mocks.writes).toEqual(["th"]);
    await act(async () => {
      resolveRead({ data: { language: "th" }, error: null });
      resolveWrite({ data: { language: "th" }, error: null });
    });
    await waitFor(() => expect(mocks.writes).toEqual(["th", "en"]));
    expect(screen.getByLabelText("language")).toHaveTextContent("en");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
  });
  it("does not write to an account when signed out", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError" },
    });
    setup();
    fireEvent.click(screen.getByText("Thai"));
    await act(async () => {});
    expect(mocks.writes).toEqual([]);
    expect(mocks.error).not.toHaveBeenCalled();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("th");
  });
  it("reports unavailable device storage", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(storeLanguage("th")).toBe(false);
    spy.mockRestore();
  });
});
