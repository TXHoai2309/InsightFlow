# Labeling Tool - Cong Nghe Su Dung

Tai lieu nay tom tat cac cong nghe dang duoc dung cho module `labeling_tool` trong InsightFlow.

## Frontend

- **Next.js 14 App Router**: tich hop tool vao InsightFlow qua route rieng `/labeling_tool`.
- **React + TypeScript**: xay dung UI gan nhan, quan ly state, filter, shortcut va luu nhan.
- **Tailwind CSS**: dung chung style voi InsightFlow, bao gom light/dark mode va layout responsive.
- **Client-side rendering**: tool chay tren client de thao tac nhanh voi danh sach post/comment va Supabase REST API.

## Data va Backend

- **Supabase Postgres**: luu du lieu crawl, queue gan nhan, annotations va lich su revision.
- **Supabase REST API**: frontend doc/ghi du lieu truc tiep qua REST endpoint voi anon key demo.
- **SQLite local**: dong vai tro database trung tam o may crawl truoc khi sync len Supabase.
- **Python pipeline**: import du lieu crawl, upsert post/comment, cap nhat metric, tao queue va sync Supabase.

## Bang Du Lieu Chinh

- `posts`: luu bai viet, metadata, metric va trang thai crawl.
- `comments`: luu comment/reply theo `platform + post_id + comment_id`.
- `labeling_assignments`: dieu phoi queue gan nhan theo thread/post/comment.
- `annotations`: luu nhan that cua tung post/comment.
- `annotation_revisions`: luu lich su moi lan sua nhan.
- `metrics_history`: luu lich su metric theo tung lan crawl.
- `change_events`: luu su kien thay doi du lieu khi crawl moi.

## Co Che Gan Nhan

- Tool load queue tu `labeling_assignments`.
- Khi gan nhan tung item, nhan duoc ghi vao `annotations`.
- Moi lan ghi/sua nhan se tao them mot ban ghi trong `annotation_revisions`.
- Khi bam hoan tat thread, assignment cua post do duoc cap nhat sang `completed` hoac `skipped`.

## Supabase Demo Mode

- Tool hien tai co the chay khong can dang nhap Supabase.
- Policy demo cho phep anon doc `posts`, `comments`, `labeling_assignments`.
- Policy demo cho phep anon ghi `annotations`, `annotation_revisions` va update `labeling_assignments`.
- Khi dua vao production, nen thay demo anon policy bang backend co xac thuc tu InsightFlow/Firebase.
