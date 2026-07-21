"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { collection, getDocs, limit, query, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, dbData, db } from "@/lib/firebase";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { buildBrandEmail, getBrandEmailDomain, slugifyBrandDomain, type BrandOption } from "@/lib/brandEmail";
import { formatBrandDisplayName } from "@/lib/services/dashboard";

interface CreatedAccount {
  uid: string;
  email: string;
  displayName: string;
  brandName: string;
  brandId: string;
  temporaryPassword: string;
  defaultRoute: string;
}

interface BrandManagerAccount extends Omit<CreatedAccount, "temporaryPassword"> {
  temporaryPassword?: string;
  hasTemporaryPassword?: boolean;
  disabled?: boolean;
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function isManualPasswordInput(event: React.ChangeEvent<HTMLInputElement>) {
  const inputType = (event.nativeEvent as InputEvent).inputType;
  if (!inputType) return true;
  return inputType === "insertText" || inputType === "insertCompositionText" || inputType.startsWith("delete");
}

function preventNonManualPasswordInput(event: React.FormEvent<HTMLInputElement>) {
  const inputType = (event.nativeEvent as InputEvent).inputType;
  if (!inputType) return;
  if (inputType !== "insertText" && inputType !== "insertCompositionText" && !inputType.startsWith("delete")) {
    event.preventDefault();
  }
}

/* ---------- Inline icons (no extra deps) ---------- */
const Icon = {
  Shield: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
    </svg>
  ),
  User: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
    </svg>
  ),
  Mail: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </svg>
  ),
  Building: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="3" width="10" height="18" rx="1" />
      <path d="M14 8h6v13h-6M7 7h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01" />
    </svg>
  ),
  Key: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8-8M16 4l3 3M13 7l2.5 2.5" />
    </svg>
  ),
  Refresh: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 4v5h5M20 20v-5h-5" />
      <path d="M5.5 15a7.5 7.5 0 0013.4 2.5M18.5 9A7.5 7.5 0 005.1 6.5" />
    </svg>
  ),
  Copy: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h10" />
    </svg>
  ),
  Check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Pencil: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  ),
  Unlock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 017.6-1.8" />
    </svg>
  ),
  Search: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Inbox: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12h5l2 3h4l2-3h5" />
      <path d="M5.5 5h13L21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6L5.5 5z" />
    </svg>
  ),
  X: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Headset: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3z" />
      <path d="M21 11h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3z" />
      <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
      <path d="M12 22v-4" />
      <path d="M3 11c0-5 4-9 9-9s9 4 9 9" />
    </svg>
  ),
  Tag: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center gap-1 rounded-md border border-app-border px-2 py-1 text-[11px] font-semibold text-app-text-secondary transition hover:border-[var(--color-brand)] hover:text-app-brand"
    >
      {copied ? <Icon.Check className="h-3 w-3" /> : <Icon.Copy className="h-3 w-3" />}
      {copied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

type AdminBrandManagerView = "overview" | "create" | "list" | "all";

export function AdminBrandManagerPage({ view = "all" }: { view?: AdminBrandManagerView }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount | null>(null);
  const [brandManagers, setBrandManagers] = useState<BrandManagerAccount[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [actionError, setActionError] = useState("");
  const [editingAccount, setEditingAccount] = useState<BrandManagerAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editBrandName, setEditBrandName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [passwordRequestUid, setPasswordRequestUid] = useState<string | null>(null);
  const [passwordRequestMode, setPasswordRequestMode] = useState<"reveal" | "reset">("reveal");
  const [adminPassword, setAdminPassword] = useState("");
  const [passwordFieldNonce, setPasswordFieldNonce] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");

  const brandPreview = useMemo(() => {
    return slugifyBrandDomain(brandName);
  }, [brandName]);

  const selectedBrand = useMemo(
    () => brandOptions.find((brand) => brand.name === brandName),
    [brandName, brandOptions],
  );
  const selectedBrandDomain = selectedBrand?.domain || getBrandEmailDomain(brandName);
  const fullEmail = buildBrandEmail(emailLocalPart, selectedBrandDomain);

  const filteredManagers = useMemo(() => {
    if (!searchTerm.trim()) return brandManagers;
    const q = searchTerm.trim().toLowerCase();
    return brandManagers.filter(
      (item) =>
        item.displayName?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.brandName?.toLowerCase().includes(q),
    );
  }, [brandManagers, searchTerm]);

  const stats = useMemo(() => {
    const total = brandManagers.length;
    const active = brandManagers.filter((item) => !item.disabled).length;
    const disabled = total - active;
    return { total, active, disabled };
  }, [brandManagers]);

  const loadCrawledBrands = async () => {
    setLoadingBrands(true);

    try {
      const brandMap = new Map<string, BrandOption>();

      const seedBrands = ["Highlands Coffee", "Starbucks", "Mixue"];
      seedBrands.forEach((name) => {
        const key = slugifyBrandDomain(name);
        brandMap.set(key, {
          id: key,
          name,
          domain: getBrandEmailDomain(name),
        });
      });

      if (dbData) {
        const snapshot = await getDocs(query(collection(dbData, "insightflow_labels"), limit(1000)));
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const rawBrand = String(data.brand || data.workspace_id || data.brandName || "").trim();
          if (!rawBrand) return;

          const name = formatBrandDisplayName(rawBrand);
          const key = slugifyBrandDomain(name);
          if (!key) return;

          brandMap.set(key, {
            id: String(data.workspace_id || data.brand || key),
            name,
            domain: getBrandEmailDomain(name),
          });
        });
      }

      const brands = Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setBrandOptions(brands);
      setBrandName((current) => current || brands[0]?.name || "");
    } catch (error) {
      console.warn("Could not load crawled brands for Admin form.", error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadBrandManagers = async () => {
    setLoadingList(true);
    setActionError("");

    try {
      await auth.authStateReady();
      if (!auth.currentUser) {
        throw new Error(t("admin.brandManager.errors.needAdmin"));
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin/brand-managers", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể tải danh sách Brand Manager.");
      }
      const managers = ((data.data || []) as BrandManagerAccount[])
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "vi"));

      setBrandManagers(managers);
    } catch (err: any) {
      setActionError(err.message || "Không thể tải danh sách Brand Manager.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBrandManagers();
    loadCrawledBrands();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreatedAccount(null);

    try {
      const passwordPolicy = validateStrongPassword(temporaryPassword);
      if (!passwordPolicy.valid) {
        throw new Error(passwordPolicy.errors.map((key) => t(key)).join(" "));
      }

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error(t("admin.brandManager.errors.needAdmin"));
      }

      const response = await fetch("/api/admin/brand-managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          email: fullEmail,
          brandName,
          temporaryPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("admin.brandManager.errors.createFailed"));
      }

      setCreatedAccount(data.data);
      setBrandManagers((current) => {
        const withoutDuplicate = current.filter((item) => item.uid !== data.data.uid);
        return [data.data, ...withoutDuplicate];
      });
      setFullName("");
      setEmailLocalPart("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setError(err.message || t("admin.brandManager.errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (account: BrandManagerAccount) => {
    setEditingAccount(account);
    setEditFullName(account.displayName || "");
    setEditBrandName(account.brandName || "");
    setActionError("");
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;
    setSavingEdit(true);
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("admin.brandManager.errors.needAdmin"));

      const response = await fetch(`/api/admin/brand-managers/${editingAccount.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editFullName,
          brandName: editBrandName,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật tài khoản.");
      }

      setBrandManagers((current) =>
        current.map((item) => (item.uid === editingAccount.uid ? { ...item, ...data.data } : item)),
      );
      setEditingAccount(null);
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật tài khoản.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (account: BrandManagerAccount) => {
    setActionError("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("admin.brandManager.errors.needAdmin"));

      const response = await fetch(`/api/admin/brand-managers/${account.uid}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ disabled: !account.disabled }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể cập nhật trạng thái tài khoản.");
      }

      setBrandManagers((current) =>
        current.map((item) => (item.uid === account.uid ? { ...item, ...data.data } : item)),
      );
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  const handleToggleStatusDirect = async (account: BrandManagerAccount) => {
    setActionError("");

    try {
      if (!auth.currentUser) throw new Error(t("admin.brandManager.errors.needAdmin"));

      const disabled = !account.disabled;
      const updatedAccount = { ...account, disabled };

      await setDoc(
        doc(db, "users", account.uid),
        {
          disabled,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setBrandManagers((current) =>
        current.map((item) => (item.uid === account.uid ? updatedAccount : item)),
      );
    } catch (err: any) {
      setActionError(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };
  const openPasswordRequest = (uid: string, mode: "reveal" | "reset") => {
    setPasswordRequestUid(uid);
    setPasswordRequestMode(mode);
    setRevealError("");
    setAdminPassword("");
    setPasswordFieldNonce(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    );
  };

  const handleRevealTemporaryPassword = async (managerUid: string) => {
    setRevealLoading(true);
    setRevealError("");

    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error("Phiên đăng nhập không hợp lệ.");
      }

      const credential = EmailAuthProvider.credential(user.email, adminPassword);
      await reauthenticateWithCredential(user, credential);

      const selectedManager = brandManagers.find((item) => item.uid === managerUid);
      if (passwordRequestMode === "reveal" && selectedManager?.temporaryPassword) {
        setRevealedPasswords((current) => ({
          ...current,
          [managerUid]: selectedManager.temporaryPassword as string,
        }));
        setPasswordRequestUid(null);
        setAdminPassword("");
        return;
      }

      const token = await user.getIdToken(true);
      const endpoint =
        passwordRequestMode === "reset"
          ? `/api/admin/brand-managers/${managerUid}/reset-temporary-password`
          : `/api/admin/brand-managers/${managerUid}/temporary-password`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          setBrandManagers((current) =>
            current.map((item) =>
              item.uid === managerUid ? { ...item, hasTemporaryPassword: false, temporaryPassword: undefined } : item,
            ),
          );
        }
        throw new Error(data.error || "Không thể thực hiện yêu cầu.");
      }

      setRevealedPasswords((current) => ({
        ...current,
        [managerUid]: data.data.temporaryPassword,
      }));
      setBrandManagers((current) =>
        current.map((item) =>
          item.uid === managerUid
            ? { ...item, hasTemporaryPassword: true, temporaryPassword: data.data.temporaryPassword }
            : item,
        ),
      );
      setPasswordRequestUid(null);
      setAdminPassword("");
    } catch (err: any) {
      const messageByCode: Record<string, string> = {
        "auth/wrong-password": "Mật khẩu xác thực của Admin không đúng.",
        "auth/invalid-credential": "Mật khẩu xác thực của Admin không đúng.",
        "auth/too-many-requests": "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      };
      const backendMessage =
        err.message === "Temporary password is no longer available for this account."
          ? "Mật khẩu tạm thời không còn khả dụng cho tài khoản này."
          : err.message;
      setRevealError(messageByCode[err.code] || backendMessage || "Yêu cầu thất bại.");
    } finally {
      setRevealLoading(false);
    }
  };

  const handleAdminPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManualPasswordInput(event)) {
      setAdminPassword("");
      setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
      return;
    }

    setAdminPassword(event.target.value);
    if (revealError === "Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.") {
      setRevealError("");
    }
  };

  const flowSteps = [
    t("admin.brandManager.flow.1"),
    t("admin.brandManager.flow.2"),
    t("admin.brandManager.flow.3"),
    t("admin.brandManager.flow.4"),
    t("admin.brandManager.flow.5"),
  ];

  if (view === "overview") {
    return (
      <div className="mx-auto max-w-[1000px] space-y-6 p-4 md:p-8">
        <section className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 md:p-7 shadow-sm">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand)] opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-app-brand">
            Admin Console
          </p>
          <h1 className="mt-2 text-[28px] font-bold text-app-text">
            Quản trị tài khoản Brand Manager
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-app-text-secondary">
            Chọn tác vụ cần thực hiện: cấp tài khoản quản lý thương hiệu mới hoặc xem và quản lý danh sách tài khoản đã tạo.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/create-brand-manager"
            className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-brand-subtle text-app-brand">
              <Icon.User className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-app-text">
              {t("nav.admin_create_brand", "Tạo tài khoản Brand Manager")}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">
              Chọn thương hiệu từ dữ liệu đã cào, nhập thông tin người quản lý và cấp mật khẩu tạm thời.
            </p>
          </Link>

          <Link
            href="/admin/brand-managers"
            className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-brand-subtle text-app-brand">
              <Icon.Building className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-app-text">
              {t("nav.admin_brand_list", "Danh sách Brand Manager")}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">
              Xem, tìm kiếm, chỉnh sửa, khóa hoặc mở khóa các tài khoản quản lý thương hiệu.
            </p>
          </Link>

          <Link
            href="/admin/consultations"
            className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-brand-subtle text-app-brand">
              <Icon.Headset className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-app-text">
              {t("nav.admin_consultations", "Yêu cầu tư vấn")}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">
              Xem và xử lý các yêu cầu tư vấn và đăng ký từ khách hàng tiềm năng.
            </p>
          </Link>

          <Link
            href="/labeling_tool"
            className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-brand-subtle text-app-brand">
              <Icon.Tag className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-[18px] font-bold text-app-text">
              {t("nav.labeling_tool", "Gắn nhãn dữ liệu")}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-app-text-secondary">
              Công cụ gắn nhãn dữ liệu hệ thống để phục vụ cho việc huấn luyện và cải thiện AI.
            </p>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 md:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-brand)] via-[var(--color-brand)]/60 to-transparent" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-brand-subtle text-app-brand">
              <Icon.Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-brand)] opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-app-brand">
                {t("admin.brandManager.badge")}
              </p>
              <h1 className="mt-1 text-[26px] font-bold leading-tight text-app-text md:text-[28px]">
                {t("admin.brandManager.title")}
              </h1>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-app-text-secondary">
                {t("admin.brandManager.subtitle")}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 md:shrink-0">
            <div className="rounded-xl border border-app-border bg-app-surface-raised px-4 py-2.5 text-center">
              <p className="text-[20px] font-bold leading-none text-app-text">{stats.total}</p>
              <p className="mt-1 text-[11px] font-medium text-app-text-muted">Tổng số</p>
            </div>
            <div className="rounded-xl border border-app-border bg-app-surface-raised px-4 py-2.5 text-center">
              <p className="text-[20px] font-bold leading-none text-emerald-600">{stats.active}</p>
              <p className="mt-1 text-[11px] font-medium text-app-text-muted">Hoạt động</p>
            </div>
            <div className="rounded-xl border border-app-border bg-app-surface-raised px-4 py-2.5 text-center">
              <p className="text-[20px] font-bold leading-none text-red-600">{stats.disabled}</p>
              <p className="mt-1 text-[11px] font-medium text-app-text-muted">Đã khóa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Flow stepper */}
      {(view === "all" || view === "create") && (
        <section className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6">
          <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.1em] text-app-text-muted">
            Quy trình cấp tài khoản
          </p>
          <div className="grid gap-3 md:grid-cols-5">
            {flowSteps.map((step, index) => (
              <div key={step} className="relative flex md:flex-col md:items-start">
                <div className="flex items-center md:mb-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-brand)] bg-app-surface backdrop-blur-md text-[12px] font-bold text-app-brand">
                    {index + 1}
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="mx-2 hidden h-[2px] flex-1 bg-[var(--color-border)] md:block" />
                  )}
                </div>
                <p className="ml-3 text-[13px] font-medium leading-5 text-app-text md:ml-0">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create account + result panel */}
      {(view === "all" || view === "create") && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 space-y-5"
          >
            <div>
              <h2 className="text-[18px] font-bold text-app-text">
                {t("admin.brandManager.form.title")}
              </h2>
              <p className="mt-1 text-[13px] text-app-text-secondary">
                {t("admin.brandManager.form.subtitle")}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                <Icon.X className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-app-text">
                  <Icon.User className="h-3.5 w-3.5 text-app-text-muted" />
                  {t("admin.brandManager.form.fullName")}
                </span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder={t("admin.brandManager.form.fullNamePlaceholder")}
                  className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-app-text">
                  <Icon.Mail className="h-3.5 w-3.5 text-app-text-muted" />
                  {t("admin.brandManager.form.email")}
                </span>
                <div className="flex overflow-hidden rounded-lg border border-app-border bg-app-surface-raised transition focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/15">
                  <input
                    value={emailLocalPart}
                    onChange={(event) => setEmailLocalPart(event.target.value)}
                    required
                    placeholder="manager"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-app-text outline-none"
                  />
                  <span className="shrink-0 border-l border-app-border px-3 py-2.5 text-[14px] text-app-text-secondary">
                    @{selectedBrandDomain || "brand.com"}
                  </span>
                </div>
                {fullEmail && (
                  <span className="block truncate text-[12px] text-app-text-muted">{fullEmail}</span>
                )}
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-app-text">
                <Icon.Building className="h-3.5 w-3.5 text-app-text-muted" />
                {t("admin.brandManager.form.brand")}
              </span>
              <select
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                required
                disabled={loadingBrands || brandOptions.length === 0}
                className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {brandOptions.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {brandPreview && (
                <span className="flex flex-wrap gap-x-3 text-[12px] text-app-text-muted">
                  <span>Brand ID: <code className="text-app-text-secondary">{brandPreview}</code></span>
                  <span>Domain: <code className="text-app-text-secondary">{selectedBrandDomain}</code></span>
                </span>
              )}
            </label>

            <label className="space-y-2 block">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-app-text">
                <Icon.Key className="h-3.5 w-3.5 text-app-text-muted" />
                {t("admin.brandManager.form.tempPassword")}
              </span>
              <div className="flex gap-2">
                <input
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  required
                  minLength={10}
                  className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 font-sans text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
                />
                <button
                  type="button"
                  onClick={() => setTemporaryPassword(generateTemporaryPassword())}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border px-4 text-[13px] font-semibold text-app-text transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
                >
                  <Icon.Refresh className="h-3.5 w-3.5" />
                  {t("admin.brandManager.form.generate")}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-app-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow duration-300 transition-all duration-300 hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-brand)]/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
            >
              {loading ? t("admin.brandManager.form.submitting") : t("admin.brandManager.form.submit")}
            </button>
          </form>

          <aside className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6">
            <h2 className="text-[16px] font-bold text-app-text">
              {t("admin.brandManager.result.title")}
            </h2>
            {createdAccount ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-app-brand-subtle p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-brand text-[13px] font-bold text-white">
                    {getInitials(createdAccount.displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-app-text">
                      {createdAccount.displayName}
                    </p>
                    <p className="truncate text-[12px] text-app-text-secondary">{createdAccount.brandName}</p>
                  </div>
                </div>

                <dl className="space-y-3 text-[13px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-app-text-muted">Email</dt>
                      <dd className="truncate text-app-text">{createdAccount.email}</dd>
                    </div>
                    <CopyButton value={createdAccount.email} label="email" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-app-text-muted">
                        {t("admin.brandManager.result.tempPassword")}
                      </dt>
                      <dd className="truncate font-sans text-app-text">{createdAccount.temporaryPassword}</dd>
                    </div>
                    <CopyButton value={createdAccount.temporaryPassword} label="mật khẩu" />
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-app-text-muted">Brand ID</dt>
                    <dd className="text-app-text">{createdAccount.brandId}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-app-text-muted">
                      {t("admin.brandManager.result.defaultRoute")}
                    </dt>
                    <dd className="text-app-text">{createdAccount.defaultRoute}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-2 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-surface-raised text-app-text-muted">
                  <Icon.Inbox className="h-5 w-5" />
                </div>
                <p className="text-[13px] leading-6 text-app-text-secondary">
                  {t("admin.brandManager.result.empty")}
                </p>
              </div>
            )}
          </aside>
        </section>
      )}

      {/* Brand manager list */}
      {(view === "all" || view === "list") && (
        <section className="rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[18px] font-bold text-app-text">Danh sách Brand Manager</h2>
              <p className="text-[13px] text-app-text-secondary">
                Quản lý toàn bộ tài khoản quản lý thương hiệu.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Icon.Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-text-muted" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  name="brand-manager-search"
                  autoComplete="off"
                  placeholder="Tìm theo tên, email, thương hiệu..."
                  className="w-56 rounded-lg border border-app-border bg-app-surface-raised py-2 pl-8 pr-3 text-[13px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
                />
              </div>
              <button
                type="button"
                onClick={loadBrandManagers}
                className="flex items-center gap-1.5 rounded-lg border border-app-border px-4 py-2 text-[13px] font-semibold text-app-text transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
              >
                <Icon.Refresh className="h-3.5 w-3.5" />
                Tải lại
              </button>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              <Icon.X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-[14px]">
              <thead className="text-[11px] uppercase tracking-[0.08em] text-app-text-muted">
                <tr className="border-b border-app-border">
                  <th className="py-3 pr-4 font-semibold">Tài khoản</th>
                  <th className="py-3 pr-4 font-semibold">Thương hiệu</th>
                  <th className="py-3 pr-4 font-semibold">Trạng thái</th>
                  <th className="py-3 pr-4 font-semibold">Mật khẩu tạm</th>
                  <th className="py-3 pr-4 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loadingList ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-4 pr-4" colSpan={5}>
                        <div className="h-10 w-full animate-pulse rounded-lg bg-app-surface-raised" />
                      </td>
                    </tr>
                  ))
                ) : filteredManagers.length === 0 ? (
                  <tr>
                    <td className="py-10" colSpan={5}>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-surface-raised text-app-text-muted">
                          <Icon.Inbox className="h-5 w-5" />
                        </div>
                        <p className="text-[13px] text-app-text-secondary">
                          {searchTerm ? "Không tìm thấy tài khoản phù hợp." : "Chưa có Brand Manager nào."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredManagers.map((item) => (
                    <tr key={item.uid} className="transition-all duration-300 hover:bg-app-surface-raised hover:-translate-y-0.5 active:translate-y-0">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-brand-subtle text-[12px] font-bold text-app-brand">
                            {getInitials(item.displayName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-app-text">{item.displayName}</p>
                            <p className="truncate text-[12px] text-app-text-secondary">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="text-app-text">{item.brandName}</p>
                        <p className="text-[12px] text-app-text-muted">{item.brandId}</p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${item.disabled ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${item.disabled ? "bg-red-500" : "bg-emerald-500"}`} />
                          {item.disabled ? "Đã khóa" : "Đang hoạt động"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        {revealedPasswords[item.uid] ? (
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[13px] text-app-text">
                              {revealedPasswords[item.uid]}
                            </span>
                            <CopyButton value={revealedPasswords[item.uid]} label="mật khẩu" />
                          </div>
                        ) : item.hasTemporaryPassword || item.temporaryPassword ? (
                          <button
                            type="button"
                            onClick={() => openPasswordRequest(item.uid, "reveal")}
                            className="rounded-lg border border-app-border px-3 py-1.5 font-sans text-[13px] text-app-text transition hover:bg-app-brand-subtle hover:text-app-brand"
                          >
                            ••••••••••
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPasswordRequest(item.uid, "reset")}
                            className="rounded-lg border border-app-border px-3 py-1.5 text-[12px] font-semibold text-app-text transition hover:bg-app-brand-subtle hover:text-app-brand"
                          >
                            Cấp lại
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex items-center gap-1.5 rounded-lg border border-app-border px-3 py-1.5 text-[12px] font-semibold text-app-text transition hover:border-[var(--color-brand)] hover:bg-app-brand-subtle"
                          >
                            <Icon.Pencil className="h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${item.disabled
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                              }`}
                          >
                            {item.disabled ? <Icon.Unlock className="h-3.5 w-3.5" /> : <Icon.Lock className="h-3.5 w-3.5" />}
                            {item.disabled ? "Mở khóa" : "Khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {passwordRequestUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              handleRevealTemporaryPassword(passwordRequestUid);
            }}
            className="w-full max-w-[420px] rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 shadow-2xl shadow-black/20 animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-[18px] font-bold text-app-text">
              {passwordRequestMode === "reset" ? "Xác thực để cấp lại mật khẩu" : "Xác thực để xem mật khẩu"}
            </h3>
            <p className="mt-2 text-[13px] leading-5 text-app-text-secondary">
              {passwordRequestMode === "reset"
                ? "Nhập mật khẩu tài khoản Admin của bạn. Hệ thống sẽ tạo mật khẩu tạm mới cho Brand Manager."
                : "Nhập mật khẩu tài khoản Admin của bạn để xem mật khẩu tạm thời hiện tại."}
            </p>

            {revealError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                {revealError}
              </div>
            )}

            <input
              type="email"
              name="username"
              value={auth.currentUser?.email || ""}
              readOnly
              autoComplete="off"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
            />

            <label className="mt-5 block space-y-2">
              <span className="text-[13px] font-semibold text-app-text">
                Mật khẩu Admin
              </span>
              <input
                key={passwordFieldNonce}
                value={adminPassword}
                onBeforeInput={preventNonManualPasswordInput}
                onPaste={(event) => {
                  event.preventDefault();
                  setAdminPassword("");
                  setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setAdminPassword("");
                  setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
                }}
                onChange={handleAdminPasswordChange}
                type="password"
                name={`manual-admin-password-${passwordFieldNonce}`}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setPasswordRequestUid(null);
                  setPasswordRequestMode("reveal");
                  setAdminPassword("");
                  setRevealError("");
                }}
                className="rounded-lg border border-app-border px-4 py-2 text-[13px] font-semibold text-app-text transition-all duration-300 hover:bg-app-surface-raised hover:-translate-y-0.5 active:translate-y-0"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={revealLoading || !adminPassword}
                className="rounded-lg bg-app-brand px-4 py-2 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-brand)]/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {revealLoading
                  ? "Đang xác thực..."
                  : passwordRequestMode === "reset"
                    ? "Cấp lại và xem"
                    : "Xem mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-2xl border border-app-border bg-app-surface backdrop-blur-md p-6 shadow-2xl shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-brand-subtle text-[12px] font-bold text-app-brand">
                  {getInitials(editingAccount.displayName)}
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-app-text">Chỉnh sửa Brand Manager</h3>
                  <p className="text-[12px] text-app-text-secondary">{editingAccount.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                aria-label="Đóng"
                className="rounded-lg p-1 text-app-text-muted transition-all duration-300 hover:bg-app-surface-raised hover:-translate-y-0.5 active:translate-y-0 hover:text-app-text"
              >
                <Icon.X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block space-y-2">
              <span className="text-[13px] font-semibold text-app-text">Họ tên</span>
              <input
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-[13px] font-semibold text-app-text">Thương hiệu</span>
              <select
                value={editBrandName}
                onChange={(event) => setEditBrandName(event.target.value)}
                disabled={brandOptions.length === 0}
                className="w-full rounded-lg border border-app-border bg-app-surface-raised px-3 py-2.5 text-[14px] text-app-text outline-none transition focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
              >
                {editBrandName && !brandOptions.some((brand) => brand.name === editBrandName) && (
                  <option value={editBrandName}>{editBrandName}</option>
                )}
                {brandOptions.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="rounded-lg border border-app-border px-4 py-2 text-[13px] font-semibold text-app-text transition-all duration-300 hover:bg-app-surface-raised hover:-translate-y-0.5 active:translate-y-0"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={savingEdit || !editFullName.trim() || !editBrandName.trim()}
                onClick={handleEditAccount}
                className="rounded-lg bg-app-brand px-4 py-2 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-[var(--color-brand-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--color-brand)]/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBrandManagerPage;
