"use client";

import { useState, useEffect } from "react";

export function useFleetSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("fleetSidebarOpen");
    if (stored !== null) {
      setIsOpen(stored === "true");
    }
  }, []);

  // Persist state to localStorage when it changes
  const toggleSidebar = () => {
    setIsOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem("fleetSidebarOpen", String(newValue));
      return newValue;
    });
  };

  return { isOpen, toggleSidebar };
}
