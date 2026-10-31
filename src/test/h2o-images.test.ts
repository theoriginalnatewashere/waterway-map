import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, MAX_IMAGES, validateImageFile } from "@/lib/h2o/images";

describe("Migrated photo limits", () => {
  it("allows six attachments", () => {
    expect(MAX_IMAGES).toBe(6);
  });
  it("allows five MiB and rejects a larger photo", () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES)], "photo.jpg", { type: "image/jpeg" });
    const large = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(validateImageFile(file).ok).toBe(true);
    expect(validateImageFile(large).ok).toBe(false);
  });
  it("accepts JPEG, PNG and WEBP but rejects a renamed non-image MIME", () => {
    for (const [name, type] of [
      ["photo.jpg", "image/jpeg"],
      ["photo.png", "image/png"],
      ["photo.webp", "image/webp"],
    ]) {
      expect(validateImageFile(new File(["photo"], name, { type })).ok).toBe(true);
    }
    expect(
      validateImageFile(new File(["not an image"], "photo.jpg", { type: "text/plain" })).ok,
    ).toBe(false);
  });
});
