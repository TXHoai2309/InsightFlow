"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { validateStrongPassword } from "@/lib/passwordPolicy";
import { buildBrandEmail, getBrandEmailDomain } from "@/lib/brandEmail";
import { Shield } from "lucide-react";

import type { RoleAssignmentOption, StaffAccount, StaffRole, StaffRoleValue, OperationOption } from "./types";
import { TeamPageHeader } from "./TeamPageHeader";
import { TeamStatsCards } from "./TeamStatsCards";
import { TeamTabs } from "./TeamTabs";
import { EmployeeToolbar } from "./EmployeeToolbar";
import { EmployeeTable } from "./EmployeeTable";
import { EmployeeEmptyState } from "./EmployeeEmptyState";
import { EmployeeCreateForm } from "./EmployeeCreateForm";
import { EmployeeCreateHandoff } from "./EmployeeCreateHandoff";
import { getBusinessRoleLabel, getStaffBusinessRole } from "./utils";
import { ExportPreviewModal } from "./ExportPreviewModal";

const roleOptions: RoleAssignmentOption[] = [
  {
    value: "crisis_employee",
    staffRole: "crisis_employee",
    labelKey: "team.roles.crisis.label",
    descriptionKey: "team.roles.crisis.description",
    defaultOperations: ["dashboard", "mentions", "alerts", "reports"],
  },
  {
    value: "lead_employee",
    staffRole: "lead_employee",
    labelKey: "team.roles.lead.label",
    descriptionKey: "team.roles.lead.description",
    defaultOperations: ["dashboard", "mentions", "leads", "reports"],
  },
];

const operationOptions: OperationOption[] = [
  { value: "dashboard", labelKey: "team.operations.dashboard", roles: ["crisis_employee", "lead_employee"] },
  { value: "mentions", labelKey: "team.operations.mentions", roles: ["crisis_employee", "lead_employee"] },
  { value: "alerts", labelKey: "team.operations.alerts", roles: ["crisis_employee", "lead_employee"] },
  { value: "reports", labelKey: "team.operations.reports", roles: ["crisis_employee", "lead_employee"] },
  { value: "leads", labelKey: "team.operations.leads", roles: ["crisis_employee", "lead_employee"] },
];

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

function isCrisisRole(role: StaffRoleValue) {
  return role === "crisis_employee" || role === "crisis_staff";
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

interface TeamManagementPageProps {
  initialTab?: "list" | "create";
}

export function TeamManagementPage({ initialTab = "list" }: TeamManagementPageProps) {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoadingStaffRef = useRef(false);
  const loadedStaffForUidRef = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<"list" | "create">(initialTab);

  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showExportPreview, setShowExportPreview] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [fullName, setFullName] = useState("");
  const [emailLocalPart, setEmailLocalPart] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("crisis_employee");
  const [operations, setOperations] = useState<string[]>(["dashboard", "mentions", "alerts", "reports"]);
  const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
  const [loading, setLoading] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<StaffAccount | null>(null);

  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState<StaffRole>("crisis_employee");
  const [editOperations, setEditOperations] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [passwordRequestUid, setPasswordRequestUid] = useState<string | null>(null);
  const [passwordRequestMode, setPasswordRequestMode] = useState<"reveal" | "reset">("reveal");
  const [managerPassword, setManagerPassword] = useState("");
  const [passwordFieldNonce, setPasswordFieldNonce] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");

  const availableOperations = useMemo(() => operationOptions, []);
  const availableEditOperations = useMemo(() => operationOptions, []);
  const selectedRoleOptions = useMemo<StaffRole[]>(() => [
    ...(operations.includes("alerts") ? ["crisis_employee" as const] : []),
    ...(operations.includes("leads") ? ["lead_employee" as const] : []),
  ], [operations]);
  const selectedEditRoleOptions = useMemo<StaffRole[]>(() => [
    ...(editOperations.includes("alerts") ? ["crisis_employee" as const] : []),
    ...(editOperations.includes("leads") ? ["lead_employee" as const] : []),
  ], [editOperations]);

  const brandEmailDomain = getBrandEmailDomain(profile?.brandName, profile?.companyDomain);
  const fullEmail = buildBrandEmail(emailLocalPart, brandEmailDomain);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "crisis") setRoleFilter("crisis_employee");
    else if (role === "lead") setRoleFilter("lead_employee");
  }, [searchParams]);

  const loadStaff = async () => {
    if (isLoadingStaffRef.current) return;
    isLoadingStaffRef.current = true;
    setLoadingList(true);
    setListError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t("team.errors.needBrandManager"));
      const response = await fetch("/api/staff", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(t("team.errors.loadFailed"));
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("team.errors.loadFailed"));
      setStaff(data.data || []);
    } catch (err: any) {
      setListError(err.message || t("team.errors.loadFailed"));
    } finally {
      isLoadingStaffRef.current = false;
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (authLoading || !profile) return;
    if (loadedStaffForUidRef.current === profile.uid) return;
    loadedStaffForUidRef.current = profile.uid;
    loadStaff();
  }, [authLoading, profile?.uid]);

  const navigateToTab = (tab: "list" | "create") => {
    setActiveTab(tab);
    setActionError("");
    setCreateError("");
    if (tab === "create") {
      router.push("/team/create-staff");
    } else {
      router.push("/team/staff");
    }
  };

  const toggleOperation = (op: string) => setOperations((curr) => curr.includes(op) ? curr.filter(i => i !== op) : [...curr, op]);
  const toggleEditOperation = (op: string) => setEditOperations((curr) => curr.includes(op) ? curr.filter(i => i !== op) : [...curr, op]);

  useEffect(() => {
    const hasCrisis = operations.includes("alerts");
    const hasLead = operations.includes("leads");
    if (hasCrisis && !hasLead && staffRole !== "crisis_employee") {
      setStaffRole("crisis_employee");
    } else if (hasLead && !hasCrisis && staffRole !== "lead_employee") {
      setStaffRole("lead_employee");
    }
  }, [operations, staffRole]);

  useEffect(() => {
    const hasCrisis = editOperations.includes("alerts");
    const hasLead = editOperations.includes("leads");
    if (hasCrisis && !hasLead && editStaffRole !== "crisis_employee") {
      setEditStaffRole("crisis_employee");
    } else if (hasLead && !hasCrisis && editStaffRole !== "lead_employee") {
      setEditStaffRole("lead_employee");
    }
  }, [editOperations, editStaffRole]);

  const toggleRoleAssignment = (value: RoleAssignmentOption["value"]) => {
    const option = roleOptions.find((item) => item.value === value);
    if (!option) return;
    const accessOperation = value === "crisis_employee" ? "alerts" : "leads";
    setOperations((current) => current.includes(accessOperation)
      ? current.filter((operation) => operation !== accessOperation)
      : Array.from(new Set([...current, ...option.defaultOperations])));
  };

  const toggleEditRoleAssignment = (value: RoleAssignmentOption["value"]) => {
    const option = roleOptions.find((item) => item.value === value);
    if (!option) return;
    const accessOperation = value === "crisis_employee" ? "alerts" : "leads";
    setEditOperations((current) => current.includes(accessOperation)
      ? current.filter((operation) => operation !== accessOperation)
      : Array.from(new Set([...current, ...option.defaultOperations])));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError("");
    try {
      const policy = validateStrongPassword(temporaryPassword);
      if (!policy.valid) throw new Error(policy.errors.map(k => t(k)).join(" "));
      if (!operations.includes("alerts") && !operations.includes("leads")) {
        throw new Error("Vui lòng chọn ít nhất một nghiệp vụ xử lý: Tiềm năng hoặc Khủng hoảng.");
      }
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fullName, email: fullEmail, staffRole, operations, temporaryPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("team.errors.createFailed"));
      setCreatedAccount(data.data);
      setStaff((curr) => [data.data, ...curr.filter(i => i.uid !== data.data.uid)]);
      setFullName("");
      setEmailLocalPart("");
      setTemporaryPassword(generateTemporaryPassword());
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateTab = () => {
    setCreateError("");
    navigateToTab("create");
  };

  const openPasswordRequest = (account: StaffAccount, mode: "reveal" | "reset") => {
    setPasswordRequestUid(account.uid);
    setPasswordRequestMode(mode);
    setRevealError("");
    setManagerPassword("");
    setPasswordFieldNonce(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    );
  };

  const handleRevealTemporaryPassword = async (uid: string) => {
    setRevealLoading(true);
    setRevealError("");
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error("Phien dang nhap khong hop le.");
      }

      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, managerPassword));
      const token = await user.getIdToken(true);
      const res = await fetch(passwordRequestMode === "reset" ? `/api/staff/${uid}/reset-temporary-password` : `/api/staff/${uid}/temporary-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Khong the thuc hien yeu cau.");
      setRevealedPasswords((c) => ({ ...c, [uid]: data.data.temporaryPassword }));
      setStaff((c) => c.map(i => i.uid === uid ? { ...i, hasTemporaryPassword: true, temporaryPassword: data.data.temporaryPassword } : i));
      setPasswordRequestUid(null);
      setManagerPassword("");
    } catch (err: any) {
      const messageByCode: Record<string, string> = {
        "auth/wrong-password": "Mat khau xac thuc cua Quan ly thuong hieu khong dung.",
        "auth/invalid-credential": "Mat khau xac thuc cua Quan ly thuong hieu khong dung.",
        "auth/too-many-requests": "Qua nhieu yeu cau. Vui long thu lai sau.",
      };
      setRevealError(messageByCode[err.code] || err.message || "Yeu cau that bai.");
    } finally { setRevealLoading(false); }
  };

  const handleManagerPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isManualPasswordInput(event)) {
      setManagerPassword("");
      setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
      return;
    }

    setManagerPassword(event.target.value);
    if (revealError === "Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.") {
      setRevealError("");
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;
    setSavingEdit(true);
    setActionError("");
    try {
      if (!editOperations.includes("alerts") && !editOperations.includes("leads")) {
        throw new Error("Vui lòng chọn ít nhất một nghiệp vụ xử lý: Tiềm năng hoặc Khủng hoảng.");
      }
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/staff/${editingStaff.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName: editFullName, staffRole: editStaffRole, operations: editOperations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff((c) => c.map(i => i.uid === editingStaff.uid ? { ...i, ...data.data } : i));
      setEditingStaff(null);
    } catch (err: any) { setActionError(err.message); } finally { setSavingEdit(false); }
  };

  const handleToggleStatus = async (account: StaffAccount) => {
    setActionError("");
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/staff/${account.uid}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disabled: !account.disabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStaff((c) => c.map(i => i.uid === account.uid ? { ...i, ...data.data } : i));
    } catch (err: any) { setActionError(err.message); }
  };

  const handleExport = () => {
    setShowExportPreview(true);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const searchMatch = !searchQuery
        || (s.displayName || "").toLowerCase().includes(searchQuery.toLowerCase())
        || (s.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const permissions = s.permissions || [];
      const businessRole = getStaffBusinessRole(permissions, s.role);
      const roleMatch =
        roleFilter === "all" ||
        (roleFilter === "crisis_employee" && (businessRole === "crisis_employee" || businessRole === "dual_employee")) ||
        (roleFilter === "lead_employee" && (businessRole === "lead_employee" || businessRole === "dual_employee")) ||
        (roleFilter === "dual_employee" && businessRole === "dual_employee");
      const statusMatch = statusFilter === "all" || (statusFilter === "active" && !s.disabled) || (statusFilter === "disabled" && s.disabled);
      return searchMatch && roleMatch && statusMatch;
    });
  }, [staff, searchQuery, roleFilter, statusFilter]);

  const openEditModal = (account: StaffAccount) => {
    const normalizedRole = isCrisisRole(account.role) ? "crisis_employee" : "lead_employee";
    const businessRole = getStaffBusinessRole(account.permissions, account.role);
    const selectedOption = roleOptions.find((option) => option.value === businessRole);
    setActionError("");
    setEditingStaff(account);
    setEditFullName(account.displayName || "");
    setEditStaffRole(selectedOption?.staffRole || normalizedRole);
    setEditOperations(account.permissions?.length ? account.permissions : selectedOption?.defaultOperations || (normalizedRole === "crisis_employee" ? ["dashboard", "mentions", "alerts", "reports"] : ["dashboard", "mentions", "leads", "reports"]));
  };

  return (
    <div data-tour="team-management" className="max-w-[1440px] mx-auto p-4 md:p-8">
      <TeamPageHeader onAddClick={handleOpenCreateTab} showAddButton={activeTab !== "create"} />
      <TeamStatsCards staff={staff} />
      <TeamTabs
        activeTab={activeTab}
        onChange={(tab) => {
          if (tab === "create") handleOpenCreateTab();
          else navigateToTab("list");
        }}
      />

      {activeTab === "list" && (
        <div className="space-y-4">
          {listError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{listError}</div>
          )}
          {loadingList ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1B20] py-20 shadow-sm dark:shadow-none">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6C5CE7] dark:border-[#9B8CFF] border-t-transparent dark:border-t-transparent" />
              <p className="text-[14px] text-gray-500 dark:text-gray-400">{t("team.listLoading")}</p>
            </div>
          ) : staff.length === 0 ? (
            <EmployeeEmptyState onAddClick={handleOpenCreateTab} />
          ) : (
            <>
              {actionError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{actionError}</div>}
              <EmployeeToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} roleFilter={roleFilter} onRoleChange={setRoleFilter} statusFilter={statusFilter} onStatusChange={setStatusFilter} onRefresh={loadStaff} onExport={handleExport} />
              <EmployeeTable staff={filteredStaff} onEdit={openEditModal} onToggleStatus={handleToggleStatus} onResetPassword={(acc) => openPasswordRequest(acc, "reset")} onRevealPassword={(acc) => openPasswordRequest(acc, "reveal")} revealedPasswords={revealedPasswords} />
            </>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <EmployeeCreateForm
            fullName={fullName}
            setFullName={setFullName}
            emailLocalPart={emailLocalPart}
            setEmailLocalPart={setEmailLocalPart}
            brandEmailDomain={brandEmailDomain}
            fullEmail={fullEmail}
            selectedRoleOptions={selectedRoleOptions}
            onToggleRoleOption={toggleRoleAssignment}
            operations={operations}
            toggleOperation={toggleOperation}
            availableOperations={availableOperations}
            temporaryPassword={temporaryPassword}
            setTemporaryPassword={setTemporaryPassword}
            onGeneratePassword={() => setTemporaryPassword(generateTemporaryPassword())}
            loading={loading}
            error={createError}
            onSubmit={handleSubmit}
            onBack={() => navigateToTab("list")}
            roleOptions={roleOptions}
            t={t}
          />
          <EmployeeCreateHandoff createdAccount={createdAccount} t={t} />
        </div>
      )}

      {passwordRequestUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 dark:bg-black/80 p-4 backdrop-blur-sm">
          <form
            autoComplete="off"
            onSubmit={(event) => {
              event.preventDefault();
              handleRevealTemporaryPassword(passwordRequestUid);
            }}
            className="w-full max-w-[420px] rounded-[24px] border border-[#E9E7EE] dark:border-white/5 bg-white/95 dark:bg-[#1A1B20]/95 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl"
          >
            <div className="px-6 pt-6 pb-2">
              <h3 className="text-[20px] font-bold text-gray-900 dark:text-white">{passwordRequestMode === "reset" ? t("team.password.modal.resetTitle") : t("team.password.modal.revealTitle")}</h3>
              <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">{passwordRequestMode === "reset" ? t("team.password.modal.resetDesc") : t("team.password.modal.revealDesc")}</p>
              {revealError && <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-[14px] text-red-700 dark:text-red-400">{revealError}</div>}
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
              <input
                key={passwordFieldNonce}
                type="password"
                name={`manual-manager-password-${passwordFieldNonce}`}
                value={managerPassword}
                onBeforeInput={preventNonManualPasswordInput}
                onPaste={(event) => {
                  event.preventDefault();
                  setManagerPassword("");
                  setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setManagerPassword("");
                  setRevealError("Vui lòng nhập mật khẩu bằng tay, không dán hoặc dùng mật khẩu đã lưu.");
                }}
                onChange={handleManagerPasswordChange}
                placeholder={t("team.password.modal.managerPassword")}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="mt-4 w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-white/20 focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#E9E7EE] dark:border-white/5 bg-gray-50/50 dark:bg-[#2A2B35]/50 px-6 py-4 rounded-b-[24px]">
              <button type="button" onClick={() => { setPasswordRequestUid(null); setManagerPassword(""); setRevealError(""); }} className="rounded-xl border border-[#E9E7EE] dark:border-white/10 px-5 py-2.5 text-[14px] font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm">Hủy</button>
              <button type="submit" disabled={revealLoading || !managerPassword} className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] px-6 py-2.5 text-[14px] font-semibold text-white dark:text-[#1A1B20] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#6C5CE7]/20 dark:hover:shadow-[#9B8CFF]/20 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0">Xác nhận</button>
            </div>
          </form>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900/60 dark:bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[560px] rounded-[24px] border border-[#E9E7EE] dark:border-white/5 bg-white/95 dark:bg-[#1A1B20]/95 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl">
            <h3 className="text-[20px] font-bold text-gray-900 dark:text-white">Chỉnh sửa nhân viên</h3>
            <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{editingStaff.email}</p>

            {actionError && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-[14px] text-red-700 dark:text-red-400">
                {actionError}
              </div>
            )}

            <label className="mt-6 block">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-300">Họ tên</span>
              <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#E9E7EE] dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3.5 text-[14px] text-gray-900 dark:text-white outline-none shadow-sm dark:shadow-none transition-all hover:border-[#6C5CE7]/30 dark:hover:border-white/20 focus:border-[#6C5CE7] dark:focus:border-[#9B8CFF] focus:ring-4 focus:ring-[#6C5CE7]/10 dark:focus:ring-[#9B8CFF]/10" />
            </label>

            <div className="mt-6">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-gray-300">Vai trò</span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {roleOptions.map((opt) => (
                  <label key={opt.value} className={`cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ${selectedEditRoleOptions.includes(opt.value) ? "border-[#6C5CE7] dark:border-[#9B8CFF] bg-gradient-to-br from-[#6C5CE7]/5 to-transparent dark:from-[#9B8CFF]/10 dark:to-transparent" : "border-[#E9E7EE] dark:border-white/10 hover:border-[#6C5CE7]/30 dark:hover:border-white/20 bg-white dark:bg-white/5 hover:shadow-sm dark:hover:shadow-none"}`}>
                    <input type="checkbox" className="sr-only" checked={selectedEditRoleOptions.includes(opt.value)} onChange={() => toggleEditRoleAssignment(opt.value)} />
                    <span className={`block text-[15px] font-bold ${selectedEditRoleOptions.includes(opt.value) ? "text-[#6C5CE7] dark:text-[#9B8CFF]" : "text-gray-900 dark:text-white"}`}>{t(opt.labelKey)}</span>
                    <span className="mt-1 block text-[13px] text-gray-500 dark:text-gray-400">{t(opt.descriptionKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            <fieldset className="mt-6 space-y-3">
              <legend className="flex items-center gap-2 text-[14px] font-semibold text-gray-900 dark:text-gray-300">
                <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                {t("team.form.operations")}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableEditOperations.map((operation) => {
                  const checked = editOperations.includes(operation.value);
                  return (
                    <label key={operation.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${checked ? "border-[#6C5CE7]/50 dark:border-[#9B8CFF]/50 bg-[#6C5CE7]/5 dark:bg-[#9B8CFF]/10" : "border-[#E9E7EE] dark:border-white/10 hover:border-[#6C5CE7]/30 dark:hover:border-white/20 bg-white dark:bg-white/5"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleEditOperation(operation.value)} className="h-4 w-4 rounded text-[#6C5CE7] dark:text-[#9B8CFF] focus:ring-[#6C5CE7] dark:focus:ring-[#9B8CFF] dark:bg-white/10 dark:border-white/20" />
                      <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{t(operation.labelKey)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-8 flex justify-end gap-3 pt-4">
              <button onClick={() => setEditingStaff(null)} className="rounded-xl border border-[#E9E7EE] dark:border-white/10 px-6 py-3 text-[14px] font-semibold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm">Hủy</button>
              <button onClick={handleEditStaff} disabled={savingEdit || !editFullName.trim()} className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] dark:from-[#9B8CFF] dark:to-[#B4A8FF] px-6 py-3 text-[14px] font-semibold text-white dark:text-[#1A1B20] shadow-[0_8px_16px_rgba(108,92,231,0.25)] dark:shadow-[0_8px_16px_rgba(155,140,255,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_rgba(108,92,231,0.3)] dark:hover:shadow-[0_12px_20px_rgba(155,140,255,0.25)] active:translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0">{savingEdit ? "Đang lưu..." : "Lưu thay đổi"}</button>
            </div>
          </div>
        </div>
      )}

      <ExportPreviewModal
        isOpen={showExportPreview}
        onClose={() => setShowExportPreview(false)}
        staffData={filteredStaff}
      />
    </div>
  );
}

export default TeamManagementPage;
