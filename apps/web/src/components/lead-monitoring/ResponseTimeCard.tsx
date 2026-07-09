import React, { useState, useEffect } from "react";
import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { responseTimeByDay } from "@/mock/leads";

export function ResponseTimeCard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Card className="flex h-[280px] flex-col rounded-2xl shadow-sm transition-shadow hover:shadow-md border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-6">
        <CardTitle className="text-[13px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Tốc độ phản hồi (Phút)
        </CardTitle>
        <Gauge className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent className="flex-1 pb-4 px-4 pt-2">
        {isMounted ? (
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeByDay} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barCategoryGap="15%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#A1A1AA", fontWeight: 500 }}
                  dy={5}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`${value} phút`, "Thời gian"]}
                  labelStyle={{ color: "#374151", fontWeight: "bold", marginBottom: "4px" }}
                />
                <Bar
                  dataKey="minutes"
                  radius={[2, 2, 0, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {responseTimeByDay.map((entry, index) => {
                    const opacity = 0.3 + (index / (responseTimeByDay.length - 1)) * 0.7;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill="#5B5CEB"
                        fillOpacity={opacity}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-full w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
        )}
      </CardContent>
    </Card>
  );
}
