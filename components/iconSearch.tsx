"use client"

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function IconSearch({ onSelect }: { onSelect: (url: string) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const searchIcons = async () => {
        setLoading(true);
        setResults([]);
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.icons || []);
        setLoading(false);
    };

    return (
        <div className="mb-4">
            <div className="flex gap-2">
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search icon..."
                />
                <Button type="button" onClick={searchIcons} disabled={loading}>
                    Search
                </Button>
            </div>
            {loading && <div className="mt-2">Loading...</div>}
            <div className="flex flex-wrap gap-4 mt-4 max-h-60 overflow-y-auto">
                {results.map(icon => (
                    <button
                        key={icon}
                        type="button"
                        className="border rounded p-3 bg-background hover:bg-muted transition"
                        onClick={() => onSelect(`https://api.iconify.design/${icon}.svg`)}
                        title={icon}
                        style={{ width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <img src={`https://api.iconify.design/${icon}.svg?color=white`} alt={icon} width={48} height={48} />
                    </button>
                ))}
            </div>
        </div>
    );
}