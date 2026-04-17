"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LocationSearchPanel from "@/components/workspace/LocationSearchPanel";
import InteractiveMapPanel from "@/components/workspace/InteractiveMapPanel";
import {
  AnalysisPayload,
  ProjectDetail,
  ProjectSummary,
} from "@/types/workspace";

type ProjectsResponse = {
  success: boolean;
  projects: ProjectSummary[];
};

type ProjectDetailResponse = {
  success: boolean;
  project: ProjectDetail;
  currentAnalysis: AnalysisPayload | null;
};

type SearchResult = {
  id: string;
  label: string;
  geojson: any;
  address?: Record<string, string>;
};

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected request error";
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
  });

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || "Request failed");
  }

  return data as T;
}

function normalizeText(value?: string) {
  return (value || "").trim().toLowerCase();
}

function matchesCity(search: string, city?: string) {
  const s = normalizeText(search);
  const c = normalizeText(city);

  if (!s || !c) return false;

  if (c.includes(s) || s.includes(c)) return true;

  const aliases: Record<string, string[]> = {
    tiruchirappalli: ["trichy", "tiruchy", "tiruchirappalli"],
    trichy: ["trichy", "tiruchy", "tiruchirappalli"],
    chennai: ["chennai", "madras"],
    coimbatore: ["coimbatore", "kovai"],
    salem: ["salem"],
    erode: ["erode"],
  };

  const cityAliases = aliases[c] || [c];
  return cityAliases.some((alias) => s.includes(alias));
}

export default function WorkspacePage() {
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null);

  const [selectedWardName, setSelectedWardName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSearchResultId, setSelectedSearchResultId] = useState("");
  const [selectedUnitName, setSelectedUnitName] = useState("");

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectedSearchResult = useMemo(
    () => searchResults.find((item) => item.id === selectedSearchResultId) || null,
    [searchResults, selectedSearchResultId]
  );

  const unitOptions = useMemo(() => {
    const features = project?.boundary?.geojson?.features || [];
    const names = features
      .map((feature) =>
        String(
          feature.properties?.__wardName ||
            feature.properties?.ward_name ||
            feature.properties?.ward ||
            feature.properties?.name ||
            ""
        )
      )
      .filter(Boolean);

    return Array.from(new Set(names));
  }, [project]);

  const effectiveSearchHighlightGeoJson = useMemo(() => {
    if (project?.boundary?.outlineGeojson) {
      return project.boundary.outlineGeojson;
    }

    if (project?.boundary?.geojson) {
      return project.boundary.geojson;
    }

    return selectedSearchResult?.geojson || null;
  }, [project, selectedSearchResult]);

  const selectedBoundaryLabel = useMemo(() => {
    if (project?.city) {
      return `${project.city} full DB coverage`;
    }

    return selectedSearchResult?.label || "";
  }, [project, selectedSearchResult]);

  const loadProjects = async (preferredProjectId?: string) => {
    try {
      setBusyKey("load-projects");

      const data = await api<ProjectsResponse>("/api/project");
      const nextProjects = data.projects || [];

      setProjects(nextProjects);

      if (preferredProjectId) {
        setSelectedProjectId(preferredProjectId);
        return;
      }

      if (!selectedProjectId && nextProjects[0]?._id) {
        setSelectedProjectId(nextProjects[0]._id);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const loadProject = async (projectId: string) => {
    if (!projectId) return;

    try {
      setBusyKey("load-project");
      setError("");

      const data = await api<ProjectDetailResponse>(`/api/project/${projectId}`);

      setProject(data.project || null);
      setAnalysis(data.currentAnalysis || null);

      const firstWard = data.currentAnalysis?.wardScores?.[0]?.wardName || "";
      setSelectedWardName((prev) => prev || firstWard);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      setBusyKey("search-location");
      setError("");

      const matchedProject = projects.find((item) => matchesCity(searchQuery, item.city));

      if (matchedProject?._id) {
        setSelectedProjectId(matchedProject._id);
        setSelectedSearchResultId("");
        setSearchResults([]);
        setSelectedUnitName("");
        return;
      }

      const response = await api<{
        success: boolean;
        results: SearchResult[];
      }>(`/api/location/search?q=${encodeURIComponent(searchQuery)}`);

      const results = response.results || [];
      setSearchResults(results);

      const firstWithGeojson =
        results.find((item) => item.geojson && item.label) || results[0] || null;

      setSelectedSearchResultId(firstWithGeojson?.id || "");
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusyKey(null);
    }
  };

  useEffect(() => {
    const preferred = searchParams.get("projectId") || undefined;
    loadProjects(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    if (!analysis?.wardScores?.length) {
      setSelectedWardName("");
      return;
    }

    const exists = analysis.wardScores.some(
      (item) => item.wardName.toLowerCase() === selectedWardName.toLowerCase()
    );

    if (!exists) {
      setSelectedWardName(analysis.wardScores[0].wardName);
    }
  }, [analysis, selectedWardName]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {error ? (
        <div className="absolute left-1/2 top-4 z-[900] -translate-x-1/2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 backdrop-blur-xl">
          {error}
        </div>
      ) : null}

      <InteractiveMapPanel
        boundaryGeoJson={project?.boundary?.geojson || null}
        analysis={analysis}
        selectedWardName={selectedWardName}
        onSelectWard={(wardName) => {
          setSelectedWardName(wardName);
          setSelectedUnitName(wardName);
        }}
        searchHighlightGeoJson={effectiveSearchHighlightGeoJson}
        selectedUnitName={selectedUnitName}
      />

      <LocationSearchPanel
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        onSearch={searchLocation}
        selectedLabel={selectedBoundaryLabel}
        unitOptions={unitOptions}
        selectedUnitName={selectedUnitName}
        onSelectUnitName={setSelectedUnitName}
      />

      {busyKey ? (
        <div className="absolute bottom-4 left-4 z-[800] rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-slate-200 backdrop-blur-2xl">
          Working: {busyKey.replace(/-/g, " ")}
        </div>
      ) : null}

      <Link
        href={
          selectedProjectId
            ? `/workspace/details?projectId=${selectedProjectId}`
            : "/workspace/details"
        }
        className="absolute bottom-4 right-4 z-[850] rounded-2xl border border-cyan-300/20 bg-cyan-400/15 px-5 py-3 text-sm font-semibold text-cyan-100 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition hover:scale-[1.02] hover:bg-cyan-400/20"
      >
        Details
      </Link>
    </main>
  );
}