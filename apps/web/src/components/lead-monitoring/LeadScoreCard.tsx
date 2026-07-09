import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useDashboardStore } from "@/stores/dashboard.store";

export function LeadScoreCard() {
  const [isMounted, setIsMounted] = useState(false);
  const { getFilteredLeadsWithoutUrgency } = useDashboardStore();
  const leads = getFilteredLeadsWithoutUrgency();
  const total = leads.length || 1;
  const leadScoreDistribution = [
    {
      label: "Hot",
      value: Math.round((leads.filter((lead) => lead.intent === "hot").length / total) * 100),
      color: "#BA1A1A",
    },
    {
      label: "Warm",
      value: Math.round((leads.filter((lead) => lead.intent === "warm").length / total) * 100),
      color: "#4234B6",
    },
    {
      label: "Cold",
      value: Math.round((leads.filter((lead) => lead.intent === "cold").length / total) * 100),
      color: "#B0A2FF",
    },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="flex h-[280px] flex-col rounded-2xl shadow-sm transition-shadow hover:shadow-md border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-6">
        <CardTitle className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Phân bố điểm tiềm năng
        </CardTitle>
        <Info className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent className="flex-1 pb-6 px-6 relative">
        <div className="flex h-full items-center">
          {/* Chart Section */}
          <div className="relative h-full w-[55%]">
            {isMounted ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadScoreDistribution}
                      cx="40%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="85%"
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {leadScoreDistribution.map((entry) => (
                         <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      formatter={(value: number) => [`${value}%`, "Tỉ lệ"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ left: '-10%' }}>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Leads</span>
                </div>
              </>
            ) : (
              <div className="h-[140px] w-[140px] animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
            )}
          </div>
          
          {/* Legend Section */}
          <div className="flex w-[45%] flex-col justify-center space-y-3">
            {leadScoreDistribution.map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[13px] text-gray-600 dark:text-gray-300">
                  {item.label} <span className="text-gray-400">({item.value}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
