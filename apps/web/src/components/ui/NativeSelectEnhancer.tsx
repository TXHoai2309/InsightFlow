"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

type SelectMenuEntry =
  | { kind: "group"; key: string; label: string }
  | {
      kind: "option";
      key: string;
      index: number;
      label: string;
      disabled: boolean;
    };

type MenuPosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  placement: "above" | "below";
};

type OpenMenu = {
  select: HTMLSelectElement;
  entries: SelectMenuEntry[];
  activeIndex: number;
  menuId: string;
  position: MenuPosition;
};

const VIEWPORT_PADDING = 8;
const MENU_GAP = 6;
const MAX_MENU_HEIGHT = 320;
const MIN_MENU_WIDTH = 180;

let menuSequence = 0;

function getEntries(select: HTMLSelectElement): SelectMenuEntry[] {
  const entries: SelectMenuEntry[] = [];

  Array.from(select.children).forEach((child, childIndex) => {
    if (child instanceof HTMLOptGroupElement) {
      entries.push({
        kind: "group",
        key: `group-${childIndex}-${child.label}`,
        label: child.label,
      });

      Array.from(child.children).forEach((option) => {
        if (!(option instanceof HTMLOptionElement)) return;
        entries.push({
          kind: "option",
          key: `option-${option.index}-${option.value}`,
          index: option.index,
          label: option.label || option.textContent?.trim() || option.value,
          disabled: child.disabled || option.disabled,
        });
      });
      return;
    }

    if (child instanceof HTMLOptionElement) {
      entries.push({
        kind: "option",
        key: `option-${child.index}-${child.value}`,
        index: child.index,
        label: child.label || child.textContent?.trim() || child.value,
        disabled: child.disabled,
      });
    }
  });

  return entries;
}

function getEnabledIndices(entries: SelectMenuEntry[]) {
  return entries.flatMap((entry) =>
    entry.kind === "option" && !entry.disabled ? [entry.index] : [],
  );
}

function getPosition(select: HTMLSelectElement, entries: SelectMenuEntry[]): MenuPosition {
  const rect = select.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const groups = entries.filter((entry) => entry.kind === "group").length;
  const options = entries.length - groups;
  const estimatedHeight = Math.min(
    MAX_MENU_HEIGHT,
    12 + groups * 25 + options * 38,
  );
  const availableBelow = viewportHeight - rect.bottom - MENU_GAP - VIEWPORT_PADDING;
  const availableAbove = rect.top - MENU_GAP - VIEWPORT_PADDING;
  const placement =
    availableBelow < Math.min(estimatedHeight, 220) && availableAbove > availableBelow
      ? "above"
      : "below";
  const availableHeight = placement === "above" ? availableAbove : availableBelow;
  const maxHeight = Math.max(96, Math.min(MAX_MENU_HEIGHT, availableHeight));
  const width = Math.min(
    Math.max(rect.width, MIN_MENU_WIDTH),
    viewportWidth - VIEWPORT_PADDING * 2,
  );
  const left = Math.min(
    Math.max(VIEWPORT_PADDING, rect.left),
    viewportWidth - width - VIEWPORT_PADDING,
  );
  const top =
    placement === "above"
      ? Math.max(
          VIEWPORT_PADDING,
          rect.top - MENU_GAP - Math.min(estimatedHeight, maxHeight),
        )
      : rect.bottom + MENU_GAP;

  return { left, top, width, maxHeight, placement };
}

function isEnhanceableSelect(element: Element | null): element is HTMLSelectElement {
  return (
    element instanceof HTMLSelectElement &&
    !element.multiple &&
    element.size <= 1 &&
    !element.disabled
  );
}

export function NativeSelectEnhancer() {
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuStateRef = useRef<OpenMenu | null>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    menuStateRef.current = menu;
  }, [menu]);

  const closeMenu = useCallback(() => {
    const current = menuStateRef.current;
    if (current) {
      delete current.select.dataset.enhancedOpen;
      if (current.select.getAttribute("aria-controls") === current.menuId) {
        current.select.removeAttribute("aria-controls");
        current.select.removeAttribute("aria-expanded");
      }
    }
    typeaheadRef.current = "";
    setMenu(null);
  }, []);

  const openMenu = useCallback((select: HTMLSelectElement) => {
    const entries = getEntries(select);
    const enabledIndices = getEnabledIndices(entries);
    if (enabledIndices.length === 0) return;

    const current = menuStateRef.current;
    if (current?.select !== select) {
      closeMenu();
    }

    const menuId = `native-select-menu-${++menuSequence}`;
    const activeIndex = enabledIndices.includes(select.selectedIndex)
      ? select.selectedIndex
      : enabledIndices[0];

    select.dataset.enhancedOpen = "true";
    select.setAttribute("aria-expanded", "true");
    select.setAttribute("aria-controls", menuId);
    select.focus({ preventScroll: true });
    setMenu({
      select,
      entries,
      activeIndex,
      menuId,
      position: getPosition(select, entries),
    });
  }, [closeMenu]);

  const selectOption = useCallback(
    (select: HTMLSelectElement, optionIndex: number) => {
      const option = select.options.item(optionIndex);
      if (!option || option.disabled) return;

      select.selectedIndex = optionIndex;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      closeMenu();
      select.focus({ preventScroll: true });
    },
    [closeMenu],
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const select = target?.closest("select") ?? null;

      if (isEnhanceableSelect(select)) {
        if (event.button !== 0) return;
        event.preventDefault();

        if (menuStateRef.current?.select === select) {
          closeMenu();
        } else {
          openMenu(select);
        }
        return;
      }

      if (menuStateRef.current && !menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const select = target?.closest("select") ?? null;
      if (isEnhanceableSelect(select)) {
        event.preventDefault();
      }
    };

    const moveActive = (direction: 1 | -1) => {
      setMenu((current) => {
        if (!current) return current;
        const enabledIndices = getEnabledIndices(current.entries);
        const currentPosition = enabledIndices.indexOf(current.activeIndex);
        const nextPosition =
          currentPosition < 0
            ? 0
            : (currentPosition + direction + enabledIndices.length) %
              enabledIndices.length;
        return { ...current, activeIndex: enabledIndices[nextPosition] };
      });
    };

    const jumpActive = (edge: "first" | "last") => {
      setMenu((current) => {
        if (!current) return current;
        const enabledIndices = getEnabledIndices(current.entries);
        return {
          ...current,
          activeIndex:
            edge === "first"
              ? enabledIndices[0]
              : enabledIndices[enabledIndices.length - 1],
        };
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const targetSelect = target?.closest("select") ?? null;
      const current = menuStateRef.current;

      if (!current) {
        if (
          isEnhanceableSelect(targetSelect) &&
          ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)
        ) {
          event.preventDefault();
          openMenu(targetSelect);
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        current.select.focus({ preventScroll: true });
        return;
      }

      if (event.key === "Tab") {
        closeMenu();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(event.key === "ArrowDown" ? 1 : -1);
        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        jumpActive(event.key === "Home" ? "first" : "last");
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectOption(current.select, current.activeIndex);
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        typeaheadRef.current += event.key.toLocaleLowerCase();
        if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadRef.current = "";
        }, 600);

        const match = current.entries.find(
          (entry) =>
            entry.kind === "option" &&
            !entry.disabled &&
            entry.label.toLocaleLowerCase().startsWith(typeaheadRef.current),
        );
        if (match?.kind === "option") {
          event.preventDefault();
          setMenu((value) =>
            value ? { ...value, activeIndex: match.index } : value,
          );
        }
      }
    };

    const refreshPosition = () => {
      setMenu((current) => {
        if (!current) return current;
        if (!current.select.isConnected) {
          delete current.select.dataset.enhancedOpen;
          return null;
        }
        return {
          ...current,
          position: getPosition(current.select, current.entries),
        };
      });
    };

    const handleChange = (event: Event) => {
      const current = menuStateRef.current;
      if (current && event.target === current.select) {
        setMenu((value) =>
          value
            ? {
                ...value,
                entries: getEntries(value.select),
                activeIndex: value.select.selectedIndex,
              }
            : value,
        );
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("change", handleChange, true);
    window.addEventListener("resize", refreshPosition);
    window.addEventListener("scroll", refreshPosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("change", handleChange, true);
      window.removeEventListener("resize", refreshPosition);
      window.removeEventListener("scroll", refreshPosition, true);
      if (typeaheadTimerRef.current) clearTimeout(typeaheadTimerRef.current);
    };
  }, [closeMenu, openMenu, selectOption]);

  useEffect(() => {
    if (!menu) return;
    document
      .getElementById(`${menu.menuId}-option-${menu.activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [menu?.activeIndex, menu?.menuId]);

  if (!menu || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      id={menu.menuId}
      role="listbox"
      aria-label={menu.select.getAttribute("aria-label") || undefined}
      className="native-select-menu"
      data-placement={menu.position.placement}
      style={{
        left: menu.position.left,
        top: menu.position.top,
        width: menu.position.width,
        maxHeight: menu.position.maxHeight,
      }}
      onPointerDown={(event) => event.preventDefault()}
    >
      {menu.entries.map((entry) => {
        if (entry.kind === "group") {
          return (
            <div key={entry.key} className="native-select-group" role="presentation">
              {entry.label}
            </div>
          );
        }

        const isSelected = entry.index === menu.select.selectedIndex;
        const isActive = entry.index === menu.activeIndex;

        return (
          <button
            key={entry.key}
            id={`${menu.menuId}-option-${entry.index}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={entry.disabled}
            className="native-select-option"
            data-active={isActive ? "true" : undefined}
            data-selected={isSelected ? "true" : undefined}
            title={entry.label}
            onMouseEnter={() => {
              if (!entry.disabled) {
                setMenu((current) =>
                  current ? { ...current, activeIndex: entry.index } : current,
                );
              }
            }}
            onClick={() => selectOption(menu.select, entry.index)}
          >
            <span>{entry.label}</span>
            {isSelected && <Check aria-hidden="true" size={16} strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
