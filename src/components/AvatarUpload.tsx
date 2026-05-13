import { useRef, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  userId: string;
  avatarUrl: string | null;
  onChange: (url: string | null) => void;
}

const ACCEPT = ".jpg,.jpeg,.png";
const MAX_BYTES = 5 * 1024 * 1024;

// Center-crop the input image to a 1:1 square at max 512x512 and return a Blob.
async function squareCrop(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    const out = Math.min(512, size);
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), "image/jpeg", 0.9),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarUpload({ userId, avatarUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(jpe?g|png)$/i.test(file.name)) {
      toast.error("Please select a JPG or PNG image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const blob = await squareCrop(file);
      const path = `${userId}/avatar.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (updErr) throw updErr;
      onChange(publicUrl);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await supabase.storage.from("avatars").remove([`${userId}/avatar.jpg`]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);
      if (error) throw error;
      onChange(null);
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-full overflow-hidden flex items-center justify-center"
        style={{ width: 96, height: 96, background: "var(--color-surface)" }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <UserIcon size={40} color="var(--color-text-secondary)" strokeWidth={1.5} />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="mt-3 disabled:opacity-50"
        style={{ color: "var(--color-primary)", fontWeight: 500, fontSize: 13 }}
      >
        {busy ? "Working…" : avatarUrl ? "Change photo" : "Change photo"}
      </button>
      {avatarUrl && (
        <button
          type="button"
          disabled={busy}
          onClick={handleRemove}
          className="mt-1 disabled:opacity-50"
          style={{ color: "var(--color-text-secondary)", fontSize: 12 }}
        >
          Remove photo
        </button>
      )}
    </div>
  );
}
