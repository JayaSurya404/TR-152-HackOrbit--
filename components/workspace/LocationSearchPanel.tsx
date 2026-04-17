"use client";

const TAMIL_NADU_SUGGESTIONS = [
  "Tiruchirappalli",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Salem",
  "Erode",
  "Tiruppur",
  "Vellore",
  "Thoothukudi",
  "Tirunelveli",
  "Dindigul",
  "Thanjavur",
  "Karur",
  "Namakkal",
  "Kancheepuram",
  "Cuddalore",
  "Nagapattinam",
  "Sivagangai",
  "Virudhunagar",
  "Ramanathapuram",
  "Pudukkottai",
  "Ariyalur",
  "Perambalur",
  "Nilgiris",
  "Krishnagiri",
  "Dharmapuri",
  "Ranipet",
  "Tenkasi",
  "Kallakurichi",
  "Mayiladuthurai",
];

type LocationSearchPanelProps = {
  searchQuery: string;
  onChangeSearchQuery: (value: string) => void;
  onSearch: () => void;
  selectedLabel: string;
  unitOptions: string[];
  selectedUnitName: string;
  onSelectUnitName: (value: string) => void;
};

export default function LocationSearchPanel({
  searchQuery,
  onChangeSearchQuery,
  onSearch,
  selectedLabel,
  unitOptions,
  selectedUnitName,
  onSelectUnitName,
}: LocationSearchPanelProps) {
  return (
    <div className="absolute left-4 top-4 z-[750] w-[min(620px,calc(100vw-2rem))] rounded-[28px] liquid-glass p-4">
      <div className="flex items-center gap-3">
        <input
          list="tamil-nadu-place-suggestions"
          value={searchQuery}
          onChange={(e) => onChangeSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="Search Tamil Nadu location..."
          className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/[0.10] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-300"
        />

        <datalist id="tamil-nadu-place-suggestions">
          {TAMIL_NADU_SUGGESTIONS.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>

        <button
          onClick={onSearch}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
        >
          Search
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-white/[0.10] px-4 py-3 text-sm text-white">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
            Selected Boundary
          </p>
          <p className="mt-1 truncate font-medium text-white">
            {selectedLabel || "No location selected yet"}
          </p>
        </div>

        <select
          value={selectedUnitName}
          onChange={(e) => onSelectUnitName(e.target.value)}
          className="w-full rounded-2xl border border-white/12 bg-white/[0.10] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All wards</option>
          {unitOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}