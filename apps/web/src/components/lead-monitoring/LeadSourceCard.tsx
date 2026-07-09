import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDashboardStore } from "@/stores/dashboard.store";

export function LeadSourceCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredLeadsWithoutUrgency } = useDashboardStore();
  const leads = getFilteredLeadsWithoutUrgency();
  const total = leads.length || 1;
  const leadSources = Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.platform] = (acc[lead.platform] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([label, count]) => ({
      label,
      count,
      value: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="flex h-[280px] flex-col rounded-2xl shadow-sm transition-shadow hover:shadow-md border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-6">
        <CardTitle className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Nguồn khách hàng
        </CardTitle>
        <Search className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent className="flex-1 pb-6 px-6 pt-2">
        <div className="flex flex-col justify-between h-full py-1">
          {leadSources.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">Chưa có dữ liệu nguồn.</p>
          ) : leadSources.map((item) => (
            <div key={item.label} className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{item.value}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                {isMounted ? (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#2E2B7A]"
                  />
                ) : (
                  <div className="h-full w-0 rounded-full bg-[#2E2B7A]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
