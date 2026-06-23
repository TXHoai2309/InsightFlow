# Dark Mode System — InsightFlow

Xây dựng hệ thống chuyển đổi giao diện Sáng/Tối đồng bộ, scalable và WCAG AA compliant cho toàn bộ InsightFlow Web App.

---

## Phân tích codebase hiện tại

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS v3
- **Styling hiện tại**: Tailwind với custom color tokens trong `tailwind.config.ts` (Material Design 3 palette) + hard-coded hex colors trong các component
- **Layout shell**: `layout.tsx` → `Sidebar.tsx` + `Header.tsx`
- **Vấn đề**: Hầu hết component dùng **hard-coded hex** (`#1A1A2E`, `#4A4A6A`, `bg-white`, `border-[#E2E4F0]`) thay vì semantic tokens → cần migrate sang CSS Variables

---

## User Review Required

> [!IMPORTANT]
> **Strategy lựa chọn**: Dùng **CSS Custom Properties (CSS Variables) + Tailwind `darkMode: 'class'`**. Khi class `dark` được thêm vào `<html>`, tất cả CSS Variables tự động chuyển sang palette tối. Đây là approach phổ biến nhất, không cần rebuild Tailwind.

> [!WARNING]
> **Hard-coded colors migration**: Rất nhiều component hiện đang dùng hard-coded hex (vd: `bg-white`, `border-[#E2E4F0]`, `text-[#1A1A2E]`). Tôi sẽ migrate chúng sang CSS Variable tokens. **Đây là thay đổi lớn nhất** nhưng cần thiết để Dark Mode hoạt động đúng.

> [!NOTE]
> **Logo trong Dark Mode**: Logo file `/public/logo.png` hiện dùng `mix-blend-multiply` (chỉ hiệu quả trên nền sáng). Trong dark mode sẽ dùng `mix-blend-normal` + filter invert hoặc dùng logo riêng. **Bạn có logo phiên bản sáng/tối riêng không?** Nếu không, tôi sẽ xử lý bằng CSS filter.

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Hệ thống hiện có file logo riêng cho dark mode không? (vd: `logo-dark.png`). Nếu không, tôi sẽ dùng CSS `filter: invert(1) brightness(2)` để tạo logo trắng tự động.

> [!NOTE]
> **Q2**: Trang `(auth)` (Login/Register) có cần Dark Mode không? Hiện tại `hideShell` routes không có Sidebar/Header.

---

## Color Palette & Token System

### Design Tokens — CSS Variables

```
────────────────────────────────────────────────────────────
TOKEN NAME                  LIGHT VALUE      DARK VALUE
────────────────────────────────────────────────────────────
--color-bg-primary          #F9F9FF          #111318
--color-bg-surface          #FFFFFF          #1C1C24
--color-bg-surface-raised   #F0F3FF          #252530
--color-bg-surface-high     #E7EEFF          #2E2E3A
--color-bg-overlay          #DEE8FF          #363645
--color-border              #E2E4F0          #2E2E3A
--color-border-strong       #C7C4D7          #44445A

--color-text-primary        #111C2D          #E4E6EB
--color-text-secondary      #4A4A6A          #A0A0B8
--color-text-muted          #9898B0          #6E6E88
--color-text-disabled       #C7C4D7          #44445A

--color-brand               #6C63FF          #7B74FF
--color-brand-hover         #5A52D5          #9B8FF8
--color-brand-subtle        #EEF0FF          #252538
--color-brand-border        #D8D6FF          #3A3860

--color-success             #22C55E          #4ADE80
--color-success-subtle      #DCFCE7          #14301F
--color-warning             #F59E0B          #FBBF24
--color-warning-subtle      #FEF3C7          #2D2008
--color-error               #EF4444          #F87171
--color-error-subtle        #FEE2E2          #2D0A0A

# Chart Colors (Dark Mode — Pastel Neon)
--chart-positive            #4648d4          #818CF8   # indigo pastel
--chart-negative            #ba1a1a          #F87171   # red pastel
--chart-neutral             #c7c4d7          #94A3B8   # slate
--chart-brand-1             (same)           #818CF8
--chart-brand-2             (same)           #34D399
--chart-brand-3             (same)           #FB923C
────────────────────────────────────────────────────────────
```

---

## Proposed Changes

### Phase 1: Foundation — Design Token System

#### [MODIFY] [globals.css](file:///e:/Netspace/InsightFlow/apps/web/src/app/globals.css)
- Thêm `:root {}` block với toàn bộ CSS Variables (Light defaults)
- Thêm `.dark {}` block override (Dark values)
- Thêm dark mode styles cho `.glass-card`, scrollbar, badge classes
- Thêm `transition: background-color 0.3s, color 0.3s, border-color 0.3s` global

#### [MODIFY] [tailwind.config.ts](file:///e:/Netspace/InsightFlow/apps/web/tailwind.config.ts)
- Thêm `darkMode: 'class'` ở top level
- Thêm semantic color tokens trỏ vào CSS Variables: `'bg-app': 'var(--color-bg-primary)'`, etc.

---

### Phase 2: Theme Context & Hook

#### [NEW] `src/contexts/ThemeContext.tsx`
- React Context với `theme: 'light' | 'dark'` và `toggleTheme()`
- Persist sang `localStorage` key `insightflow-theme`
- `useEffect` đọc từ localStorage khi mount, set class `dark` trên `<html>`
- Tránh flash: inject inline script vào `<head>` để set class trước React hydration

#### [NEW] `src/hooks/useTheme.ts`
- Convenience hook: `const { theme, toggleTheme } = useTheme()`

#### [MODIFY] [layout.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/app/layout.tsx)
- Wrap children bằng `<ThemeProvider>`
- Thêm inline `<script>` vào `<head>` để đọc localStorage và set `dark` class trước khi paint (tránh FOUC)

---

### Phase 3: Toggle Button trong Header

#### [MODIFY] [Header.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/layout/Header.tsx)
- Import `useTheme` hook
- Thêm Toggle Button giữa Notification Bell và User Profile
- **Design**: Pill-shaped toggle với Sun ☀️ / Moon 🌙 icon (Tabler Icons: `ti-sun` / `ti-moon`)
- **Animation**: `transition-all duration-300` + translate animation của icon bên trong pill
- **ARIA**: `aria-label="Chuyển sang chế độ tối/sáng"`, `role="switch"`, `aria-checked`
- Migrate hard-coded colors → CSS variable classes

---

### Phase 4: Layout Component Migration

#### [MODIFY] [Header.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/layout/Header.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`
- `border-[#E2E4F0]` → `border-[var(--color-border)]`
- `text-[#1A1A2E]` → `text-[var(--color-text-primary)]`
- `text-[#4A4A6A]` → `text-[var(--color-text-secondary)]`
- `bg-[#F7F8FC]` → `bg-[var(--color-bg-surface-raised)]`
- Notification dropdown: dark mode styles

#### [MODIFY] [Sidebar.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/layout/Sidebar.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`
- `border-[#E2E4F0]` → `border-[var(--color-border)]`
- Active nav item: `bg-[#EEF0FF]` → `bg-[var(--color-brand-subtle)]`
- Logo: thêm dark mode handling (CSS filter hoặc điều kiện)
- Hover states: cập nhật với CSS variables

---

### Phase 5: Dashboard Components

#### [MODIFY] [StatCard.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/StatCard.tsx)
- `glass-card` class đã abstract — chỉ cần update `.glass-card` trong globals.css
- Trend badges: `bg-green-100 text-green-700` → thêm dark variants

#### [MODIFY] [SentimentDonut.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/SentimentDonut.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`
- **Chart colors (Dark Mode)**: Subscribe to theme context, re-create chart khi theme thay đổi
- Dark: `#818CF8` (indigo pastel), `#F87171` (red pastel), `#94A3B8` (slate)
- Thêm `plugins.tooltip` background color cho dark mode

#### [MODIFY] [SentimentTrend.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/SentimentTrend.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`
- **Chart colors (Dark Mode)**: Tương tự Donut, re-render khi theme thay đổi
- Grid lines: `rgba(255,255,255,0.1)` trong dark mode
- Tick labels: `#A0A0B8` trong dark mode

#### [MODIFY] [TopSources.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/TopSources.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`
- Progress bar track: `bg-surface-container` (đã là token, cần CSS variable support)

#### [MODIFY] [TopTopics.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/TopTopics.tsx)
- `bg-white` → `bg-[var(--color-bg-surface)]`

#### [MODIFY] [DashboardFilters.tsx](file:///e:/Netspace/InsightFlow/apps/web/src/components/dashboard/DashboardFilters.tsx)
- Filter buttons, select dropdowns, date inputs

---

### Phase 6: Other Pages (Mentions, Alerts, Leads, Reports)

#### [MODIFY] `src/components/mentions/MentionTable.tsx`
- Table header, rows, badges, hover states

#### [MODIFY] `src/components/mentions/MentionFilters.tsx`  
- Filter panel dark mode

#### [MODIFY] `src/components/mentions/MentionStats.tsx`
- Stats cards dark mode

#### [MODIFY] `src/app/alerts/page.tsx` & `src/components/alerts/*.tsx`
- Alert cards, severity badges dark mode

#### [MODIFY] `src/app/leads/page.tsx` & `src/components/leads/*.tsx`  
- Lead cards, status indicators dark mode

#### [MODIFY] `src/app/reports/page.tsx` & `src/components/reports/*.tsx`
- Report cards, charts dark mode

---

## Implementation Strategy

### Approach: CSS Variables + Tailwind `darkMode: 'class'`

```
User clicks toggle
    → toggleTheme() called
    → localStorage.setItem('insightflow-theme', 'dark')
    → document.documentElement.classList.add('dark')
    → CSS: html.dark { --color-bg-primary: #111318; ... }
    → All components using var(--color-...) automatically update
    → Chart components: detect theme change via useTheme(), re-render chart
```

### Anti-FOUC Script (Critical)
```html
<script>
  (function() {
    const t = localStorage.getItem('insightflow-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  })();
</script>
```

---

## Verification Plan

### Automated Tests
```bash
# Build check
npm run build --prefix apps/web
```

### Manual Verification
1. Toggle button xuất hiện đúng vị trí (bên phải bell, trước avatar)
2. Click toggle → UI chuyển sang dark trong < 300ms (smooth transition)
3. Reload trang → dark mode được ghi nhớ (không bị flash trắng)
4. Tất cả 5 trang: Dashboard, Mentions, Alerts, Leads, Reports đều dark
5. Biểu đồ dùng màu pastel trên nền tối — dễ đọc
6. Contrast test: dùng DevTools Accessibility panel kiểm tra WCAG AA
7. Logo hiển thị đúng trên cả hai nền

### Files sẽ thay đổi
| File | Type | Lý do |
|------|------|--------|
| `globals.css` | MODIFY | CSS Variables foundation |
| `tailwind.config.ts` | MODIFY | darkMode + semantic tokens |
| `layout.tsx` | MODIFY | ThemeProvider + anti-FOUC script |
| `Header.tsx` | MODIFY | Toggle button + color migration |
| `Sidebar.tsx` | MODIFY | Color migration |
| `SentimentDonut.tsx` | MODIFY | Chart dark palette |
| `SentimentTrend.tsx` | MODIFY | Chart dark palette |
| `StatCard.tsx` | MODIFY | Token migration |
| `TopSources.tsx` | MODIFY | Token migration |
| `TopTopics.tsx` | MODIFY | Token migration |
| `DashboardFilters.tsx` | MODIFY | Token migration |
| `MentionTable.tsx` | MODIFY | Token migration |
| `MentionFilters.tsx` | MODIFY | Token migration |
| `MentionStats.tsx` | MODIFY | Token migration |
| `alerts/` components | MODIFY | Token migration |
| `leads/` components | MODIFY | Token migration |
| `reports/` components | MODIFY | Token migration |
| `ThemeContext.tsx` | NEW | Theme state management |
| `useTheme.ts` | NEW | Convenience hook |
