import { describe, expect, it } from "vitest";
import { avatarImageUrl, isOwnAvatarUrl } from "@/lib/avatar";

const BASE = "https://res.cloudinary.com/misty/image/upload";

describe("isOwnAvatarUrl", () => {
  it("aceita foto da nossa conta, na pasta de avatares", () => {
    expect(isOwnAvatarUrl(`${BASE}/v1728000000/mistydoces/avatars/abc123.jpg`, "misty")).toBe(true);
    expect(isOwnAvatarUrl(`${BASE}/mistydoces/avatars/abc_123-x.webp`, "misty")).toBe(true);
  });

  it("recusa outra conta, outra pasta ou outro site", () => {
    expect(isOwnAvatarUrl(`https://res.cloudinary.com/outra/image/upload/mistydoces/avatars/a.jpg`, "misty")).toBe(false);
    expect(isOwnAvatarUrl(`${BASE}/mistydoces/produtos/a.jpg`, "misty")).toBe(false);
    expect(isOwnAvatarUrl(`https://exemplo.com/mistydoces/avatars/a.jpg`, "misty")).toBe(false);
  });

  it("recusa caminhos que tentam escapar da pasta", () => {
    expect(isOwnAvatarUrl(`${BASE}/mistydoces/avatars/../produtos/a.jpg`, "misty")).toBe(false);
    expect(isOwnAvatarUrl(`${BASE}/mistydoces/avatars/a.jpg?x=1`, "misty")).toBe(false);
  });

  it("recusa tudo quando o Cloudinary não está configurado", () => {
    expect(isOwnAvatarUrl(`${BASE}/mistydoces/avatars/a.jpg`, undefined)).toBe(false);
  });
});

describe("avatarImageUrl", () => {
  it("pede a versão quadrada recortada no rosto", () => {
    expect(avatarImageUrl(`${BASE}/v1/mistydoces/avatars/a.jpg`, 72)).toBe(
      `${BASE}/c_thumb,g_face,w_72,h_72,f_auto/v1/mistydoces/avatars/a.jpg`,
    );
  });
});
