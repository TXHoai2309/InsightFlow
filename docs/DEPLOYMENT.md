# InsightFlow Deployment Guide\n\nKubernetes and deployment details placeholder\n
---

## Labeling Tool Deployment

### Bien moi truong

Can cau hinh cac bien sau cho ung dung web InsightFlow:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Trong ban demo, co the dung anon key vi Supabase policy da mo quyen doc/ghi co gioi han cho tool. Khi production, nen bo demo anon write policy va chuyen ghi du lieu qua backend da xac thuc.

### Supabase schema

Truoc khi dung tool, can co cac bang chinh:

- `posts`
- `comments`
- `labeling_assignments`
- `annotations`
- `annotation_revisions`
- `metrics_history`
- `change_events`

Du lieu crawl nen duoc import vao SQLite truoc, sau do sync len Supabase bang script pipeline.

### Quy trinh van hanh demo

1. Chay crawler de tao JSON output.
2. Import JSON vao SQLite bang pipeline import.
3. Sync SQLite len Supabase.
4. Mo `/labeling_tool` trong InsightFlow.
5. Chon nen tang, khoang ngay va bam `Tai data / Load data`.
6. Gan nhan, xem lai hoac sua nhan truc tiep tren tool.

### Luu y hieu nang

- Khi test, nen load 5-20 thread moi lan.
- Khi loc ngay, nen chon khoang ngay hep.
- Facebook post co nhieu comment co the load cham vi tool can tai toan bo comment cua thread.
- Nen them cot ngay loc truc tiep vao `labeling_assignments` neu muon load nhanh trong production.

### Bao mat production

- Khong nen de anon role co quyen ghi truc tiep trong production.
- Nen su dung Firebase Auth cua InsightFlow de xac thuc nguoi dung.
- Backend nen kiem tra role/permission roi moi ghi `annotations`, `annotation_revisions` va update `labeling_assignments`.
