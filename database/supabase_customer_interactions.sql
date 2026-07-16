-- Same-platform customer interaction identity and lookup indexes.
-- Safe to run repeatedly. Existing author/contact/payload fields are preserved.

begin;

alter table public.posts
  add column if not exists platform_author_id text,
  add column if not exists platform_profile_url text,
  add column if not exists platform_identity_key text,
  add column if not exists identity_method text,
  add column if not exists identity_confidence text;

alter table public.comments
  add column if not exists platform_author_id text,
  add column if not exists platform_profile_url text,
  add column if not exists platform_identity_key text,
  add column if not exists identity_method text,
  add column if not exists identity_confidence text;

create or replace function public.insightflow_normalize_profile_url(
  source_platform text,
  source_contact text
) returns text
language sql
immutable
as $$
  select case
    when source_contact !~* '^https?://' then null
    when lower(coalesce(source_platform, '')) = 'facebook'
      and source_contact !~* 'facebook\\.com' then null
    when lower(coalesce(source_platform, '')) = 'tiktok'
      and source_contact !~* 'tiktok\\.com' then null
    when lower(coalesce(source_platform, '')) in ('thread', 'threads')
      and source_contact !~* 'threads\\.(net|com)' then null
    when lower(coalesce(source_platform, '')) = 'youtube'
      and source_contact !~* '(youtube\\.com|youtu\\.be)' then null
    when source_contact ~* '/(watch|video|videos|post|posts|reel|reels|shorts|comment|comments)(/|\\?|$)'
      then null
    else lower(regexp_replace(split_part(trim(source_contact), '#', 1), '/+$', ''))
  end;
$$;

with candidates as (
  select
    post_id,
    platform as raw_platform,
    lower(trim(platform)) as normalized_platform,
    nullif(trim(payload_json ->> 'author_id'), '') as author_id,
    public.insightflow_normalize_profile_url(platform, contact) as profile_url
  from public.posts
)
update public.posts as target
set
  platform_author_id = candidates.author_id,
  platform_profile_url = candidates.profile_url,
  platform_identity_key = case
    when candidates.author_id is not null then candidates.normalized_platform || ':id:' || candidates.author_id
    when candidates.profile_url is not null then candidates.normalized_platform || ':profile:' || candidates.profile_url
    else null
  end,
  identity_method = case
    when candidates.author_id is not null then 'author_id'
    when candidates.profile_url is not null then 'profile_url'
    else null
  end,
  identity_confidence = case
    when candidates.author_id is not null then 'high'
    when candidates.profile_url is not null then 'medium'
    else 'unknown'
  end
from candidates
where target.post_id = candidates.post_id
  and target.platform = candidates.raw_platform;

with candidates as (
  select
    comment_id,
    platform as raw_platform,
    lower(trim(platform)) as normalized_platform,
    nullif(trim(payload_json ->> 'author_id'), '') as author_id,
    public.insightflow_normalize_profile_url(platform, contact) as profile_url
  from public.comments
)
update public.comments as target
set
  platform_author_id = candidates.author_id,
  platform_profile_url = candidates.profile_url,
  platform_identity_key = case
    when candidates.author_id is not null then candidates.normalized_platform || ':id:' || candidates.author_id
    when candidates.profile_url is not null then candidates.normalized_platform || ':profile:' || candidates.profile_url
    else null
  end,
  identity_method = case
    when candidates.author_id is not null then 'author_id'
    when candidates.profile_url is not null then 'profile_url'
    else null
  end,
  identity_confidence = case
    when candidates.author_id is not null then 'high'
    when candidates.profile_url is not null then 'medium'
    else 'unknown'
  end
from candidates
where target.comment_id = candidates.comment_id
  and target.platform = candidates.raw_platform;

create or replace function public.insightflow_set_platform_identity()
returns trigger
language plpgsql
as $$
declare
  normalized_platform text := lower(trim(coalesce(new.platform, '')));
  detected_author_id text := nullif(trim(coalesce(new.payload_json ->> 'author_id', '')), '');
  detected_profile_url text := public.insightflow_normalize_profile_url(new.platform, new.contact);
begin
  new.platform_author_id := detected_author_id;
  new.platform_profile_url := detected_profile_url;
  if detected_author_id is not null then
    new.platform_identity_key := normalized_platform || ':id:' || detected_author_id;
    new.identity_method := 'author_id';
    new.identity_confidence := 'high';
  elsif detected_profile_url is not null then
    new.platform_identity_key := normalized_platform || ':profile:' || detected_profile_url;
    new.identity_method := 'profile_url';
    new.identity_confidence := 'medium';
  else
    new.platform_identity_key := null;
    new.identity_method := null;
    new.identity_confidence := 'unknown';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_platform_identity on public.posts;
create trigger posts_set_platform_identity
before insert or update of platform, contact, payload_json on public.posts
for each row execute function public.insightflow_set_platform_identity();

drop trigger if exists comments_set_platform_identity on public.comments;
create trigger comments_set_platform_identity
before insert or update of platform, contact, payload_json on public.comments
for each row execute function public.insightflow_set_platform_identity();

create index if not exists posts_platform_identity_brand_posted_idx
  on public.posts (platform, platform_identity_key, brand_slug, posted_at desc)
  where platform_identity_key is not null;

create index if not exists comments_platform_identity_posted_idx
  on public.comments (platform, platform_identity_key, posted_at desc)
  where platform_identity_key is not null;

create index if not exists posts_platform_post_id_idx
  on public.posts (platform, post_id);

commit;

notify pgrst, 'reload schema';
