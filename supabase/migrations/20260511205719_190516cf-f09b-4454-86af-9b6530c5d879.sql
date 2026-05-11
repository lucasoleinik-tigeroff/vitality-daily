-- Block LIST/enumeration of avatars and guide_covers while keeping
-- public CDN URL fetches working.
--
-- How this works:
--   * Public CDN endpoint /storage/v1/object/public/{bucket}/{path} resolves
--     by exact path on a bucket flagged public=true and does NOT consult
--     storage.objects RLS. Direct <img src> URL fetches keep working.
--   * supabase.storage.from(bucket).list() and any /object/list/* call
--     selects rows from storage.objects and IS subject to RLS. With no
--     SELECT policy granting access, list returns []/denied for anon and
--     authenticated callers (admins/owners still hit their own policies
--     for write paths, but those are not SELECT).
--
-- Documented accepted state after this migration:
--   * Linter warnings 0025 (public bucket allows listing) for avatars and
--     guide_covers will still appear, because the bucket.public flag stays
--     true. This is intentional: keeping the flag public lets us serve
--     images via the CDN edge without signed-URL overhead. The actual
--     listing/enumeration risk is mitigated by the RLS change below.
--   * Future hardening: flip buckets to private and switch the app to
--     signed URLs (createSignedUrl) for both avatar and cover rendering.
--   * Linter warnings for authenticated EXECUTE on public.has_role and
--     public.user_journey_day are accepted; rationale is documented in the
--     prior migration's function-access matrix comment.

DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read guide covers"      ON storage.objects;

-- (No replacement SELECT policy is created. Public CDN reads bypass RLS;
--  list endpoints will now return empty for non-privileged callers.)
