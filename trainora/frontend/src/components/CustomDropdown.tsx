import { useState, useRef, useEffect } from "react";
import "./css/CustomDropdown.css";

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

export default function CustomDropdown({ value, onChange, options, placeholder = "Bitte wählen..." }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(opt => opt.value === value) || null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={ref}>
      <div
        className="custom-dropdown__selected"
        onClick={() => setOpen(!open)}
      >
        {selected ? selected.label : placeholder}
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <ul className="custom-dropdown__list">
          {options.map((opt: DropdownOption) => (
            <li
              key={opt.value}
              className={`custom-dropdown__item ${opt.value === value ? "active" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
