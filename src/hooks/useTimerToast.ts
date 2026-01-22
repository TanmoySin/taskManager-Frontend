import { useEffect } from "react";
import { useActiveTimer } from "./useAnalytics";
import { toast } from "react-hot-toast";

export const useTimerToast = () => {
  const { data: activeTimer } = useActiveTimer();
  const hasActiveTimer = activeTimer?.isRunning || false;

  useEffect(() => {
    if (hasActiveTimer) {
      const taskTitle = activeTimer?.taskId?.title || "Unknown Task";
      toast.success(`Timer started for: ${taskTitle}`, {
        icon: "⏱️",
        duration: 3000,
      });
    }
  }, [hasActiveTimer]);
};
