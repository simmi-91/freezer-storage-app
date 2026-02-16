import { useState, useEffect, useRef, type ChangeEvent } from "react";
import type { FreezerItem, Category } from "../types";
import { CATEGORIES, CATEGORY_SHELF_LIFE } from "../types";
import { addMonths } from "../utils/dates";

interface PhotoCaptureProps {
    onAddItems: (items: Omit<FreezerItem, "id">[]) => void;
    onCancel: () => void;
}

interface IdentifiedItem {
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    confidence: number;
}

interface ResultRow {
    checked: boolean;
    name: string;
    category: Category;
    quantity: string;
    unit: string;
    confidence: number;
}

type Step = "upload" | "loading" | "results";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function defaultExpiry(category: Category): string {
    return addMonths(new Date(), CATEGORY_SHELF_LIFE[category].max);
}

export function PhotoCapture({ onAddItems, onCancel }: PhotoCaptureProps) {
    const [step, setStep] = useState<Step>("upload");
    const [preview, setPreview] = useState<string | null>(null);
    const [results, setResults] = useState<ResultRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onCancel();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Read file as base64
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            setPreview(dataUrl);

            // Extract base64 data (remove data:image/...;base64, prefix)
            const base64 = dataUrl.split(",")[1];
            setStep("loading");

            try {
                const response = await fetch("/api/identify-food", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64 }),
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data: { items: IdentifiedItem[] } = await response.json();

                setResults(
                    data.items.map((item) => ({
                        checked: item.confidence > 50,
                        name: item.name,
                        category: item.category,
                        quantity: String(item.quantity),
                        unit: item.unit,
                        confidence: item.confidence,
                    }))
                );
                setStep("results");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to analyze photo");
                setStep("upload");
            }
        };
        reader.readAsDataURL(file);
    }

    function updateResult(index: number, updates: Partial<ResultRow>) {
        setResults((prev) =>
            prev.map((row, i) => (i === index ? { ...row, ...updates } : row))
        );
    }

    function handleAddSelected() {
        const selected = results.filter((r) => r.checked);
        if (selected.length === 0) return;

        const today = todayISO();
        const items: Omit<FreezerItem, "id">[] = selected.map((row) => ({
            name: row.name.trim(),
            category: row.category,
            quantity: Number(row.quantity) || 1,
            unit: row.unit.trim() || "pcs",
            dateAdded: today,
            expiryDate: defaultExpiry(row.category),
            notes: "Added via photo",
        }));

        onAddItems(items);
    }

    const checkedCount = results.filter((r) => r.checked).length;

    return (
        <div className="modal-overlay" onClick={onCancel} role="presentation">
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Identify Food from Photo"
            >
                <h2>Identify Food from Photo</h2>

                {step === "upload" && (
                    <>
                        <div
                            className="photo-upload-area"
                            onClick={() => fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            aria-label="Select or take a photo"
                        >
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Selected food photo"
                                    className="photo-capture-preview"
                                />
                            ) : (
                                <div className="photo-upload-placeholder">
                                    <span className="photo-upload-icon">&#128247;</span>
                                    <p>Click to select or take a photo</p>
                                    <p className="photo-upload-hint">
                                        Supports JPG, PNG, HEIC
                                    </p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                                className="sr-only"
                                aria-label="Upload food photo"
                            />
                        </div>
                        {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
                    </>
                )}

                {step === "loading" && (
                    <div className="photo-loading">
                        {preview && (
                            <img
                                src={preview}
                                alt="Analyzing food photo"
                                className="photo-capture-preview"
                            />
                        )}
                        <p className="photo-loading-text">Analyzing photo...</p>
                    </div>
                )}

                {step === "results" && (
                    <>
                        {preview && (
                            <img
                                src={preview}
                                alt="Analyzed food photo"
                                className="photo-capture-preview"
                            />
                        )}
                        {results.length === 0 ? (
                            <p className="photo-no-results">
                                No food items were identified. Try a clearer photo.
                            </p>
                        ) : (
                            <div className="photo-results">
                                <p className="photo-results-summary">
                                    {results.length} item{results.length !== 1 ? "s" : ""} identified
                                    {checkedCount > 0 && ` (${checkedCount} selected)`}
                                </p>
                                {results.map((row, index) => (
                                    <div key={index} className="photo-result-item">
                                        <label className="photo-result-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={row.checked}
                                                onChange={(e) =>
                                                    updateResult(index, { checked: e.target.checked })
                                                }
                                            />
                                        </label>
                                        <div className="photo-result-fields">
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={row.name}
                                                onChange={(e) =>
                                                    updateResult(index, { name: e.target.value })
                                                }
                                                aria-label={`Item ${index + 1} name`}
                                            />
                                            <select
                                                className="form-select"
                                                value={row.category}
                                                onChange={(e) =>
                                                    updateResult(index, {
                                                        category: e.target.value as Category,
                                                    })
                                                }
                                                aria-label={`Item ${index + 1} category`}
                                            >
                                                {CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="photo-result-qty-row">
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={row.quantity}
                                                    min="1"
                                                    onChange={(e) =>
                                                        updateResult(index, {
                                                            quantity: e.target.value,
                                                        })
                                                    }
                                                    aria-label={`Item ${index + 1} quantity`}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={row.unit}
                                                    onChange={(e) =>
                                                        updateResult(index, { unit: e.target.value })
                                                    }
                                                    aria-label={`Item ${index + 1} unit`}
                                                />
                                                <span className="photo-result-confidence badge">
                                                    {row.confidence}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                    {step === "results" && results.length > 0 && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAddSelected}
                            disabled={checkedCount === 0}
                        >
                            Add Selected ({checkedCount})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
