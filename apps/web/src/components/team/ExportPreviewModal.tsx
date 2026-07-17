"use client";

import React, { useState } from "react";
import { X, FileSpreadsheet, Download, Users, Shield, UserCheck, Target, AlertTriangle } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { StaffAccount } from "./types";
import { getStaffBusinessRole } from "./utils";
import { useAuth } from "@/hooks/useAuth";

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffData: StaffAccount[];
}

function getInitials(name: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ExportPreviewModal({
  isOpen,
  onClose,
  staffData,
}: ExportPreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { profile } = useAuth();

  if (!isOpen) return null;

  const totalStaff = staffData.length;
  const activeStaff = staffData.filter((s) => !s.disabled).length;
  const activeRoles = new Set(
    staffData.map((s) => getStaffBusinessRole(s.permissions, s.role))
  ).size;

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Small artificial delay to show UI state
      await new Promise((resolve) => setTimeout(resolve, 500));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Danh_sach_nhan_vien", {
        views: [{ state: "frozen", xSplit: 0, ySplit: 7 }], // Cố định hàng từ 1 đến 7
      });

      const brandName = profile?.brandName || "InsightFlow";

      // --- Thiết lập Header Báo cáo ---
      
      // Dòng 1: Tên thương hiệu
      worksheet.addRow([brandName.toUpperCase()]);
      worksheet.mergeCells("A1:D1");
      worksheet.getCell("A1").font = { size: 11, bold: true, color: { argb: "FF6B7280" } };
      worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };

      // Dòng 2: Tiêu đề báo cáo
      worksheet.addRow(["DANH SÁCH NHÂN SỰ"]);
      worksheet.mergeCells("A2:D2");
      worksheet.getCell("A2").font = { size: 16, bold: true, color: { argb: "FF111827" } };
      worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };

      // Dòng 3: Thời gian xuất
      const currentDate = new Date().toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" });
      worksheet.addRow([`Ngày xuất báo cáo: ${currentDate}`]);
      worksheet.mergeCells("A3:D3");
      worksheet.getCell("A3").font = { size: 11, italic: true, color: { argb: "FF6B7280" } };
      worksheet.getCell("A3").alignment = { vertical: "middle", horizontal: "center" };

      // Dòng 4: Cách khoảng trống
      worksheet.addRow([]);

      // Dòng 5: Thống kê
      worksheet.addRow([
        `Tổng nhân sự: ${totalStaff}`,
        `Số vai trò: ${activeRoles}`,
        `Đang hoạt động: ${activeStaff}`,
        "",
      ]);
      worksheet.getCell("A5").font = { bold: true, color: { argb: "FF374151" } };
      worksheet.getCell("B5").font = { bold: true, color: { argb: "FF374151" } };
      worksheet.getCell("C5").font = { bold: true, color: { argb: "FF374151" } };
      worksheet.getCell("A5").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getCell("B5").alignment = { vertical: "middle", horizontal: "center" };
      worksheet.getCell("C5").alignment = { vertical: "middle", horizontal: "center" };

      // Dòng 6: Cách khoảng trống
      worksheet.addRow([]);

      // --- Thiết lập Bảng Dữ liệu ---

      // Dòng 7: Tiêu đề cột
      const headers = ["Họ và tên", "Email liên hệ", "Vai trò", "Trạng thái"];
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 30; // Tăng chiều cao header

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF6C5CE7" }, // Màu tím đặc trưng InsightFlow
        };
        cell.font = {
          color: { argb: "FFFFFFFF" },
          bold: true,
          size: 12,
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF4B42A3" } },
          left: { style: "thin", color: { argb: "FF4B42A3" } },
          bottom: { style: "thin", color: { argb: "FF4B42A3" } },
          right: { style: "thin", color: { argb: "FF4B42A3" } },
        };
      });

      // Điều chỉnh độ rộng cột tự động
      worksheet.columns = [
        { key: "name", width: 35 },
        { key: "email", width: 45 },
        { key: "role", width: 25 },
        { key: "status", width: 20 },
      ];

      // Thêm Dữ liệu
      staffData.forEach((row, index) => {
        const businessRole = getStaffBusinessRole(row.permissions, row.role);
        let roleLabel = "Không xác định";
        let roleBgColor = "FFF3F4F6"; // Xám nhạt
        let roleFontColor = "FF4B5563"; // Xám đậm

        // Map roles to colors
        if (businessRole === "lead_employee") {
          roleLabel = "Lead";
          roleBgColor = "FFEFF6FF"; // Xanh dương nhạt (blue-50)
          roleFontColor = "FF1D4ED8"; // Xanh dương đậm (blue-700)
        } else if (businessRole === "crisis_employee") {
          roleLabel = "Crisis";
          roleBgColor = "FFFEF2F2"; // Đỏ nhạt (red-50)
          roleFontColor = "FFB91C1C"; // Đỏ đậm (red-700)
        } else if (businessRole === "dual_employee") {
          roleLabel = "Crisis & Lead";
          roleBgColor = "FFFAF5FF"; // Tím nhạt (purple-50)
          roleFontColor = "FF7E22CE"; // Tím đậm (purple-700)
        }

        // Map status to colors
        const statusLabel = row.disabled ? "Đã khóa" : "Đang hoạt động";
        const statusBgColor = row.disabled ? "FFFEF2F2" : "FFF0FDF4"; // Đỏ nhạt : Xanh lá nhạt
        const statusFontColor = row.disabled ? "FFB91C1C" : "FF15803D"; // Đỏ đậm : Xanh lá đậm

        const dataRow = worksheet.addRow([
          row.displayName || "Chưa cập nhật",
          row.email || "",
          roleLabel,
          statusLabel,
        ]);

        dataRow.height = 25; // Tăng chiều cao mỗi dòng để dễ nhìn hơn

        // Định dạng từng ô trong dòng
        dataRow.eachCell((cell, colNumber) => {
          // Màu xen kẽ giữa các hàng (Zebra striping)
          const isEven = index % 2 === 0;
          const baseFillColor = isEven ? "FFFFFFFF" : "FFF9FAFB"; // Trắng hoặc Xám siêu nhạt

          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };

          if (colNumber === 1 || colNumber === 2) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baseFillColor } };
            cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
          }

          if (colNumber === 3) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: roleBgColor } };
            cell.font = { color: { argb: roleFontColor }, bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }

          if (colNumber === 4) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statusBgColor } };
            cell.font = { color: { argb: statusFontColor }, bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center" };
          }
        });
      });

      // Thêm AutoFilter cho các cột
      worksheet.autoFilter = {
        from: { row: 7, column: 1 },
        to: { row: staffData.length + 7, column: 4 },
      };

      // Sinh file Excel và tải về
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Danh_Sach_Nhan_Su_${Date.now()}.xlsx`);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Đã xảy ra lỗi khi xuất file Excel. Vui lòng kiểm tra lại cấu hình hệ thống.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm transition-all duration-300">
      <div
        className="flex w-full max-w-[65vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "85vh", minWidth: "900px" }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 shadow-sm border border-green-100">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">
                  Xem trước tệp Excel
                </h2>
                <p className="text-[13px] text-gray-500 font-medium">
                  <strong className="text-gray-900">{totalStaff}</strong> bản ghi sẽ được xuất ra tệp .xlsx
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg bg-transparent p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Row (Compact) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white shadow-sm border border-gray-100 text-gray-500">
                <Users className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-medium text-gray-500 leading-tight">Tổng nhân sự</p>
                <p className="text-[14px] font-bold text-gray-900 leading-tight">{totalStaff}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white shadow-sm border border-gray-100 text-gray-500">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-medium text-gray-500 leading-tight">Vai trò hiện có</p>
                <p className="text-[14px] font-bold text-gray-900 leading-tight">{activeRoles}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-white shadow-sm border border-gray-100 text-green-600">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-medium text-gray-500 leading-tight">Đang hoạt động</p>
                <p className="text-[14px] font-bold text-gray-900 leading-tight">{activeStaff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Preview */}
        <div className="flex-1 overflow-auto bg-gray-50/30">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-100/90 backdrop-blur-sm text-[12px] font-bold uppercase tracking-wider text-gray-500 shadow-sm">
              <tr>
                <th className="px-6 py-3 w-[45%]">Nhân sự</th>
                <th className="px-4 py-3 w-[25%]">Email liên hệ</th>
                <th className="px-4 py-3 w-[15%] text-center">Vai trò</th>
                <th className="px-6 py-3 text-center w-[15%]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {staffData.slice(0, 50).map((row, index) => {
                const businessRole = getStaffBusinessRole(row.permissions, row.role);

                // Role Badge configuration
                let RoleIcon = Shield;
                let roleColor = "bg-gray-50 text-gray-600 border-gray-200";
                let roleLabel = "Chưa rõ";

                if (businessRole === "lead_employee") {
                  RoleIcon = Target;
                  roleColor = "bg-blue-50 text-blue-700 border-blue-100";
                  roleLabel = "Lead";
                } else if (businessRole === "crisis_employee") {
                  RoleIcon = AlertTriangle;
                  roleColor = "bg-red-50 text-red-700 border-red-100";
                  roleLabel = "Crisis";
                } else if (businessRole === "dual_employee") {
                  RoleIcon = Shield;
                  roleColor = "bg-purple-50 text-purple-700 border-purple-100";
                  roleLabel = "Crisis & Lead";
                }

                return (
                  <tr
                    key={index}
                    className="group transition-colors duration-150 hover:bg-gray-50 h-[56px]"
                  >
                    <td className="px-6 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-[12px] font-bold text-gray-600 shadow-sm group-hover:from-indigo-100 group-hover:to-purple-100 group-hover:text-indigo-700 transition-colors">
                          {getInitials(row.displayName || "")}
                        </div>
                        <span className="font-semibold text-gray-900 truncate">
                          {row.displayName || (
                            <span className="text-gray-400 italic font-normal">Chưa cập nhật</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600 font-medium truncate max-w-[200px]" title={row.email || ""}>
                      {row.email}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${roleColor}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleLabel}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-center">
                      {!row.disabled ? (
                        <div className="inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          Đang hoạt động
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                          Đã khóa
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Pagination / Limit indicator */}
              {totalStaff > 50 && (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-gray-50/50 px-6 py-4 text-center text-[12px] font-medium text-gray-500"
                  >
                    ... và <strong className="text-gray-700">{totalStaff - 50}</strong> bản ghi khác sẽ được đưa vào file Excel.
                  </td>
                </tr>
              )}
              {totalStaff === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-[13px] font-medium text-gray-500"
                  >
                    <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    Không có dữ liệu nào để xuất ra Excel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
          <div className="text-[13px] font-medium text-gray-500">
            Định dạng xuất:{" "}
            <span className="font-bold text-gray-700 ml-1">Excel (.xlsx)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting || totalStaff === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-green-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              {isExporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isExporting ? "Đang xử lý..." : "Xác nhận xuất Excel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
