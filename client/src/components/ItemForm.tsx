import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import type { FreezerItem, FreezerItemFormData, Category } from "../types";
import { CATEGORIES, CATEGORY_SHELF_LIFE } from "../types";
import { addMonths } from "../utils/dates";

interface ItemFormProps {
    mode: "add" | "edit";
    item?: FreezerItem;
    existingItems?: FreezerItem[];
    onSave: (data: Omit<FreezerItem, "id">) => void;
    onCancel: () => void;
    onEditExisting?: (id: number) => void;
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function defaultExpiry(category: Category): string {
    return addMonths(new Date(), CATEGORY_SHELF_LIFE[category].max);
}

function buildInitialData(mode: "add" | "edit", item?: FreezerItem): FreezerItemFormData {
    if (mode === "edit" && item) {
        return {
            name: item.name,
            category: item.category,
            quantity: String(item.quantity),
            unit: item.unit,
            dateAdded: item.dateAdded,
            expiryDate: item.expiryDate,
            notes: item.notes,
        };
    }
    const category: Category = "Other";
    return {
        name: "",
        category,
        quantity: "1",
        unit: "pcs",
        dateAdded: todayISO(),
        expiryDate: defaultExpiry(category),
        notes: "",
    };
}

type ValidationErrors = Partial<Record<keyof FreezerItemFormData, string>>;

function validate(data: FreezerItemFormData): ValidationErrors {
    const errors: ValidationErrors = {};
    if (!data.name.trim()) errors.name = "Name is required";
    const qty = Number(data.quantity);
    if (!data.quantity.trim() || isNaN(qty) || qty <= 0) {
        errors.quantity = "Quantity must be a positive number";
    }
    if (!data.unit.trim()) errors.unit = "Unit is required";
    if (!data.expiryDate) {
        errors.expiryDate = "Expiry date is required";
    } else if (isNaN(new Date(data.expiryDate + "T00:00:00").getTime())) {
        errors.expiryDate = "Expiry date must be a valid date";
    }
    return errors;
}

function inputClass(field: string, errors: ValidationErrors): string {
    return errors[field as keyof FreezerItemFormData]
        ? "form-input form-input--error"
        : "form-input";
}

const UNIT_SUGGESTIONS = ["pcs", "bags", "kg", "g", "portions", "liters"];

const EXPIRY_SHORTCUTS = [
    { label: "3 months", months: 3 },
    { label: "6 months", months: 6 },
    { label: "1 year", months: 12 },
] as const;

export function ItemForm({
    mode,
    item,
    existingItems = [],
    onSave,
    onCancel,
    onEditExisting,
}: ItemFormProps) {
    const [formData, setFormData] = useState<FreezerItemFormData>(() =>
        buildInitialData(mode, item)
    );
    const [errors, setErrors] = useState<ValidationErrors>({});
    const expiryManuallySet = useRef(mode === "edit");

    // Autocomplete state (add mode only)
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Build unique item names for autocomplete
    const uniqueItems = useMemo(() => {
        const seen = new Map<string, FreezerItem>();
        for (const existing of existingItems) {
            const key = existing.name.toLowerCase();
            if (!seen.has(key)) {
                seen.set(key, existing);
            }
        }
        return seen;
    }, [existingItems]);

    // Filtered suggestions based on current input
    const suggestions = useMemo(() => {
        if (mode !== "add" || !formData.name.trim()) return [];
        const query = formData.name.toLowerCase();
        const matches: FreezerItem[] = [];
        for (const [key, val] of uniqueItems) {
            if (key.includes(query) && key !== query) {
                matches.push(val);
            }
        }
        return matches;
    }, [mode, formData.name, uniqueItems]);

    function selectSuggestion(suggestion: FreezerItem) {
        if (onEditExisting) {
            onEditExisting(suggestion.id);
        }
    }

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
                setActiveIndex(-1);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                if (showSuggestions) {
                    setShowSuggestions(false);
                    setActiveIndex(-1);
                } else {
                    onCancel();
                }
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onCancel, showSuggestions]);

    function updateField<K extends keyof FreezerItemFormData>(
        key: K,
        value: FreezerItemFormData[K]
    ) {
        setFormData((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }

    function handleCategoryChange(category: Category) {
        updateField("category", category);
        if (!expiryManuallySet.current) {
            setFormData((prev) => ({
                ...prev,
                category,
                expiryDate: defaultExpiry(category),
            }));
        }
    }

    function handleExpiryChange(value: string) {
        expiryManuallySet.current = true;
        updateField("expiryDate", value);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const validationErrors = validate(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        onSave({
            name: formData.name.trim(),
            category: formData.category,
            quantity: Number(formData.quantity),
            unit: formData.unit.trim(),
            dateAdded: formData.dateAdded,
            expiryDate: formData.expiryDate,
            notes: formData.notes.trim(),
        });
    }

    return (
        <div className="modal-overlay" onClick={onCancel} role="presentation">
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={mode === "add" ? "Add Item" : "Edit Item"}>
                <h2>{mode === "add" ? "Add Item" : "Edit Item"}</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="item-name">
                                Name <span aria-hidden="true">*</span>
                            </label>
                            <div className="autocomplete-wrapper" ref={autocompleteRef}>
                                <input
                                    id="item-name"
                                    className={inputClass("name", errors)}
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        updateField("name", e.target.value);
                                        if (mode === "add") {
                                            setShowSuggestions(true);
                                            setActiveIndex(-1);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (mode === "add" && suggestions.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (
                                            mode !== "add" ||
                                            !showSuggestions ||
                                            suggestions.length === 0
                                        )
                                            return;
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setActiveIndex(
                                                (prev) => (prev + 1) % suggestions.length
                                            );
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setActiveIndex((prev) =>
                                                prev <= 0 ? suggestions.length - 1 : prev - 1
                                            );
                                        } else if (e.key === "Enter" && activeIndex >= 0) {
                                            e.preventDefault();
                                            selectSuggestion(suggestions[activeIndex]);
                                        }
                                    }}
                                    placeholder="e.g. Chicken Breasts"
                                    autoComplete="off"
                                    aria-required="true"
                                    aria-invalid={!!errors.name}
                                    aria-autocomplete={mode === "add" ? "list" : undefined}
                                    aria-controls={mode === "add" ? "name-suggestions" : undefined}
                                    aria-activedescendant={
                                        activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
                                    }
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul
                                        id="name-suggestions"
                                        className="autocomplete-dropdown"
                                        role="listbox"
                                        aria-label="Name suggestions">
                                        {suggestions.map((s, i) => (
                                            <li
                                                key={s.id}
                                                id={`suggestion-${i}`}
                                                className={`autocomplete-item${
                                                    i === activeIndex
                                                        ? " autocomplete-item--active"
                                                        : ""
                                                }`}
                                                role="option"
                                                aria-selected={i === activeIndex}
                                                onMouseDown={() => selectSuggestion(s)}
                                                onMouseEnter={() => setActiveIndex(i)}>
                                                <span className="autocomplete-item-name">
                                                    {s.name}
                                                </span>
                                                <span className="autocomplete-item-detail">
                                                    {s.category} &middot; {s.unit}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            {errors.name && <span className="form-error">{errors.name}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="item-category">
                                Category <span aria-hidden="true">*</span>
                            </label>
                            <select
                                id="item-category"
                                className="form-select"
                                value={formData.category}
                                onChange={(e) => handleCategoryChange(e.target.value as Category)}
                                aria-required="true">
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="item-quantity">
                                Quantity <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="item-quantity"
                                className={inputClass("quantity", errors)}
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => updateField("quantity", e.target.value)}
                                aria-required="true"
                                aria-invalid={!!errors.quantity}
                            />
                            {errors.quantity && (
                                <span className="form-error">{errors.quantity}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="item-unit">
                                Unit <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="item-unit"
                                className={inputClass("unit", errors)}
                                type="text"
                                value={formData.unit}
                                onChange={(e) => updateField("unit", e.target.value)}
                                placeholder="Or type a custom unit..."
                                aria-required="true"
                                aria-invalid={!!errors.unit}
                            />
                            <div className="unit-picker">
                                {UNIT_SUGGESTIONS.map((u) => (
                                    <button
                                        key={u}
                                        type="button"
                                        className={`btn-shortcut${
                                            formData.unit === u ? " btn-shortcut--active" : ""
                                        }`}
                                        onClick={() => updateField("unit", u)}>
                                        {u}
                                    </button>
                                ))}
                            </div>
                            {errors.unit && <span className="form-error">{errors.unit}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="item-date-added">
                                Date Added
                            </label>
                            <input
                                id="item-date-added"
                                className="form-input"
                                type="date"
                                value={formData.dateAdded}
                                onChange={(e) => updateField("dateAdded", e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="item-expiry-date">
                                Expiry Date <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="item-expiry-date"
                                className={inputClass("expiryDate", errors)}
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => handleExpiryChange(e.target.value)}
                                aria-required="true"
                                aria-invalid={!!errors.expiryDate}
                            />
                            <div className="expiry-shortcuts">
                                {EXPIRY_SHORTCUTS.map((shortcut) => {
                                    const shortcutDate = addMonths(new Date(), shortcut.months);
                                    const isActive = formData.expiryDate === shortcutDate;
                                    return (
                                        <button
                                            key={shortcut.months}
                                            type="button"
                                            className={`btn-shortcut${
                                                isActive ? " btn-shortcut--active" : ""
                                            }`}
                                            onClick={() => handleExpiryChange(shortcutDate)}>
                                            {shortcut.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.expiryDate && (
                                <span className="form-error">{errors.expiryDate}</span>
                            )}
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label" htmlFor="item-notes">
                                Notes
                            </label>
                            <textarea
                                id="item-notes"
                                className="form-input"
                                value={formData.notes}
                                onChange={(e) => updateField("notes", e.target.value)}
                                placeholder="Optional notes"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {mode === "add" ? "Add Item" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
