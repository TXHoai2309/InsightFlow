import { useState } from "react";
import type { Mention } from "@/types/dashboard";

interface ReassignData {
  sentiment: "positive" | "negative" | "neutral";
  topics: string[];
  notes: string;
}

export function useMentionReassign() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openReassignModal = (mention: Mention) => {
    setSelectedMention(mention);
    setIsOpen(true);
    setError(null);
  };

  const closeReassignModal = () => {
    setIsOpen(false);
    setSelectedMention(null);
    setError(null);
  };

  const submitReassign = async (data: ReassignData) => {
    if (!selectedMention) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/mentions/${selectedMention.id}/reassign`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // if (!response.ok) {
      //   throw new Error('Cập nhật thất bại');
      // }

      console.log("Reassign submitted:", { mention: selectedMention, ...data });

      closeReassignModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isOpen,
    selectedMention,
    isLoading,
    error,
    openReassignModal,
    closeReassignModal,
    submitReassign,
  };
}
