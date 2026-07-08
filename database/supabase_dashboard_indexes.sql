-- Dashboard query indexes for Supabase REST.
-- Run this in Supabase SQL Editor if /leads or /dashboard requests time out.

create index if not exists posts_posted_at_desc_idx
  on public.posts (posted_at desc);

create index if not exists posts_post_id_idx
  on public.posts (post_id);

create index if not exists comments_post_id_idx
  on public.comments (post_id);

create index if not exists annotations_post_id_idx
  on public.annotations (post_id);

notify pgrst, 'reload schema';
