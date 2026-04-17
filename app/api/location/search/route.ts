import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  geojson?: {
    type?: string;
    coordinates?: unknown;
  };
  address?: Record<string, string>;
  class?: string;
  type?: string;
  importance?: number;
  addresstype?: string;
};

type SearchResult = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  geojson: {
    type: "FeatureCollection";
    features: Array<{
      type: "Feature";
      properties: Record<string, unknown>;
      geometry: Record<string, unknown>;
    }>;
  } | null;
  address: Record<string, string>;
  score: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isPolygonGeometry(
  geojson?: { type?: string; coordinates?: unknown } | null
) {
  if (!geojson?.type) return false;
  return geojson.type === "Polygon" || geojson.type === "MultiPolygon";
}

function normalizeGeoJson(item: NominatimResult) {
  if (item.geojson && typeof item.geojson === "object" && isPolygonGeometry(item.geojson)) {
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {
            label: item.display_name,
            class: item.class || "",
            type: item.type || "",
            importance: item.importance ?? null,
            address: item.address || {},
          },
          geometry: item.geojson as Record<string, unknown>,
        },
      ],
    };
  }

  return null;
}

function buildCandidateText(item: NominatimResult) {
  const address = item.address || {};
  return normalizeText(
    [
      item.display_name,
      address.city,
      address.town,
      address.village,
      address.suburb,
      address.county,
      address.state_district,
      address.state,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function scoreResult(item: NominatimResult, query: string) {
  const q = normalizeText(query);
  const address = item.address || {};
  const candidateText = buildCandidateText(item);

  let score = 0;

  if (isPolygonGeometry(item.geojson)) score += 60;
  else score -= 100;

  if (candidateText.includes(q)) score += 35;

  const exactKeys = [
    address.city,
    address.town,
    address.village,
    address.suburb,
    address.county,
    address.state_district,
  ]
    .filter(Boolean)
    .map((v) => normalizeText(String(v)));

  if (exactKeys.includes(q)) score += 55;

  const cls = normalizeText(item.class || "");
  const typ = normalizeText(item.type || "");
  const addresstype = normalizeText(item.addresstype || "");

  if (cls === "boundary") score += 20;
  if (cls === "place") score += 12;

  if (
    ["administrative", "city", "town", "municipality", "suburb", "village"].includes(typ)
  ) {
    score += 20;
  }

  if (
    ["city", "town", "suburb", "village", "county", "state_district"].includes(addresstype)
  ) {
    score += 15;
  }

  const state = normalizeText(address.state || "");
  const country = normalizeText(address.country || "");

  if (state.includes("tamil nadu")) score += 20;
  if (country.includes("india")) score += 10;

  score += Math.round((item.importance || 0) * 10);

  return score;
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        { success: false, error: "q is required" },
        { status: 400 }
      );
    }

    const query = q.toLowerCase().includes("tamil nadu")
      ? q
      : `${q}, Tamil Nadu, India`;

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "10");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("polygon_geojson", "1");
    url.searchParams.set("countrycodes", "in");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HackOrbit-Tensor26/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Location search failed" },
        { status: 500 }
      );
    }

    const data = (await response.json()) as NominatimResult[];

    const scoredResults: SearchResult[] = (data || [])
      .map((item) => ({
        id: String(item.place_id),
        label: item.display_name,
        lat: Number(item.lat),
        lon: Number(item.lon),
        geojson: normalizeGeoJson(item),
        address: item.address || {},
        score: scoreResult(item, q),
      }))
      .filter((item) => item.geojson !== null)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      results: scoredResults,
      bestResult: scoredResults[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Location search failed",
      },
      { status: 500 }
    );
  }
}