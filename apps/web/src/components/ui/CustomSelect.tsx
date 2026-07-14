"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  className?: string;
  minWidth?: string;
  icon?: React.ReactNode;
}

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "above" | "below";
};

export function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  minWidth = "160px",
  icon,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex];

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 8;
    const gap = 6;
    const estimatedHeight = Math.min(320, options.length * 38 + 10);
    const below = window.innerHeight - rect.bottom - gap - viewportPadding;
    const above = rect.top - gap - viewportPadding;
    const placement =
      below < Math.min(estimatedHeight, 220) && above > below ? "above" : "below";
    const availableHeight = placement === "above" ? above : below;
    const maxHeight = Math.max(96, Math.min(320, availableHeight));
    const width = Math.min(
      Math.max(rect.width, 180),
      window.innerWidth - viewportPadding * 2,
    );
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - width - viewportPadding,
    );
    const top =
      placement === "above"
        ? Math.max(viewportPadding, rect.top - gap - Math.min(estimatedHeight, maxHeight))
        : rect.bottom + gap;

    setPosition({ top, left, width, maxHeight, placement });
  }, [options.length]);

  const openMenu = useCallback(() => {
    if (options.length === 0) return;
    setActiveIndex(selectedIndex);
    updatePosition();
    setIsOpen(true);
  }, [options.length, selectedIndex, updatePosition]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const chooseOption = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      closeMenu();
      triggerRef.current?.focus({ preventScroll: true });
    },
    [closeMenu, onChange, options],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [closeMenu, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    document
      .getElementById(`${menuId}-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen, menuId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openMenu();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      closeMenu();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (current) => (current + direction + options.length) % options.length,
      );
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseOption(activeIndex);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ minWidth }}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        disabled={options.length === 0}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-white py-2.5 pl-4 pr-3 text-[13px] font-medium text-[#2A2B2F] outline-none transition dark:bg-[#1a1b1e] dark:text-white ${
          isOpen
            ? "border-[#6D5FFD] ring-2 ring-[#6D5FFD]/15"
            : "border-gray-200 hover:border-gray-300 focus-visible:border-[#6D5FFD] focus-visible:ring-2 focus-visible:ring-[#6D5FFD]/15 dark:border-gray-800 dark:hover:border-gray-700"
        }`}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            className="native-select-menu"
            data-placement={position.placement}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            onPointerDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={option.value}
                  id={`${menuId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className="native-select-option"
                  data-active={isActive ? "true" : undefined}
                  data-selected={isSelected ? "true" : undefined}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => chooseOption(index)}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check aria-hidden="true" size={16} strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
