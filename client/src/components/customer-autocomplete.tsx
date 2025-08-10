import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomers } from "@/hooks/use-customers";

interface Customer {
  id?: number;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  whoBought?: string | null;
}

interface CustomerAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect: (customer: Customer) => void;
  placeholder: string;
  type?: "name" | "mobile";
  required?: boolean;
  id: string;
}

export function CustomerAutocomplete({
  label,
  value,
  onChange,
  onCustomerSelect,
  placeholder,
  type = "name",
  required = false,
  id
}: CustomerAutocompleteProps) {
  const { data: customers = [] } = useCustomers();
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);



  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const filteredCustomers = customers.filter(customer => {
        if (type === "name") {
          return customer.name.toLowerCase().includes(value.toLowerCase());
        } else {
          return customer.mobile.includes(value);
        }
      });

      setSuggestions(filteredCustomers.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(filteredCustomers.length > 0);
      setActiveSuggestion(-1);
    }, 300); // Debounce to prevent excessive updates

    return () => clearTimeout(timeoutId);
  }, [value, type, customers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeSuggestion >= 0) {
          selectCustomer(suggestions[activeSuggestion]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const selectCustomer = (customer: Customer) => {
    isSelectingRef.current = true;
    const newValue = type === "name" ? customer.name : customer.mobile;
    onChange(newValue);
    onCustomerSelect(customer);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    
    // Reset the flag after a brief delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (activeSuggestion >= 0 && suggestionRefs.current[activeSuggestion]) {
      suggestionRefs.current[activeSuggestion]?.scrollIntoView({
        block: "nearest"
      });
    }
  }, [activeSuggestion]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label htmlFor={id} className={`label-standard ${required ? 'required' : ''}`}>
        {label}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        type={type === "mobile" ? "tel" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && !isSelectingRef.current) {
            setShowSuggestions(true);
          }
        }}
        onBlur={(e) => {
          // Only hide if not clicking on a suggestion
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setTimeout(() => {
              if (!isSelectingRef.current) {
                setShowSuggestions(false);
              }
            }, 150);
          }
        }}
        required={required}
        className="input-standard"
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((customer, index) => (
            <div
              key={`${customer.name}-${customer.mobile}`}
              ref={el => suggestionRefs.current[index] = el}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                index === activeSuggestion ? "bg-blue-50" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from firing
                selectCustomer(customer);
              }}
              onClick={() => selectCustomer(customer)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.mobile}</div>
                </div>
                {type === "name" && value.toLowerCase() === customer.name.toLowerCase() && (
                  <div className="text-xs text-blue-600 font-medium">Match</div>
                )}
                {type === "mobile" && value === customer.mobile && (
                  <div className="text-xs text-blue-600 font-medium">Match</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
