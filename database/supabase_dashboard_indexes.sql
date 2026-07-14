-- Dashboard query indexes for Supabase REST.
-- Run this in Supabase SQL Editor if /leads or /dashboard requests time out.

-- 1. Index cho sắp xếp thời gian (Tăng tốc các câu lệnh ORDER BY DESC)
CREATE INDEX IF NOT EXISTS posts_posted_at_desc_idx
  ON public.posts (posted_at DESC);

CREATE INDEX IF NOT EXISTS posts_brand_slug_posted_at_desc_idx
  ON public.posts (brand_slug, posted_at DESC) INCLUDE (post_id);

CREATE INDEX IF NOT EXISTS posts_brand_posted_at_desc_idx
  ON public.posts (brand, posted_at DESC) INCLUDE (post_id);

CREATE INDEX IF NOT EXISTS annotations_created_at_desc_idx
  ON public.annotations (created_at DESC);

CREATE INDEX IF NOT EXISTS leads_created_at_desc_idx
  ON public.leads (created_at DESC);

CREATE INDEX IF NOT EXISTS label_change_requests_requested_at_desc_idx
  ON public.label_change_requests (requested_at DESC);

-- 2. Index cho khóa ngoại (Tăng tốc JOIN và hạn chế treo khi DELETE Cascade)
CREATE INDEX IF NOT EXISTS posts_post_id_idx
  ON public.posts (post_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx
  ON public.comments (post_id);

CREATE INDEX IF NOT EXISTS comments_comment_id_idx
  ON public.comments (comment_id);

CREATE INDEX IF NOT EXISTS comments_platform_post_id_level_posted_idx
  ON public.comments (platform, post_id, comment_level, posted_at);

CREATE INDEX IF NOT EXISTS annotations_post_id_idx
  ON public.annotations (post_id);

CREATE INDEX IF NOT EXISTS annotations_comment_id_idx
  ON public.annotations (comment_id);

CREATE INDEX IF NOT EXISTS annotations_platform_post_assignee_idx
  ON public.annotations (platform, post_id, assignee);

CREATE INDEX IF NOT EXISTS annotations_platform_status_updated_at_desc_idx
  ON public.annotations (platform, status, updated_at DESC) INCLUDE (post_id, comment_id, entity_key);

CREATE INDEX IF NOT EXISTS labeling_assignments_platform_status_updated_idx
  ON public.labeling_assignments (platform, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS labeling_assignments_platform_post_idx
  ON public.labeling_assignments (platform, post_id);

CREATE INDEX IF NOT EXISTS leads_mention_id_idx
  ON public.leads (mention_id);

CREATE INDEX IF NOT EXISTS leads_workspace_id_idx
  ON public.leads (workspace_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
