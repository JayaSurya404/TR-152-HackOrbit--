import { NextRequest, NextResponse } from "next/server";
import * as turf from "@turf/turf";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import Analysis from "@/models/Analysis";
import Report from "@/models/Report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BENCHMARK_PROFILE = "urban-slum-v1";
const BENCHMARK_LABEL = "Urban Informal Settlement Benchmark v1";

const BENCHMARK_TARGETS = {
  water: 85,
  sanitation: 80,
  electricity: 92,
  road: 75,
  drainage: 70,
  waste: 72,
};

const CITY_CONFIGS = [
  {
    key: "trichy",
    query: "Tiruchirappalli",
    city: "Tiruchirappalli",
    displayName: "Trichy Infrastructure Project",
    wardCount: 18,
    bias: {
      water: -4,
      sanitation: -7,
      electricity: 2,
      road: -4,
      drainage: -8,
      waste: -6,
    },
  },
  {
    key: "chennai",
    query: "Chennai",
    city: "Chennai",
    displayName: "Chennai Infrastructure Project",
    wardCount: 24,
    bias: {
      water: -6,
      sanitation: -5,
      electricity: 6,
      road: 1,
      drainage: -7,
      waste: -4,
    },
  },
  {
    key: "coimbatore",
    query: "Coimbatore",
    city: "Coimbatore",
    displayName: "Coimbatore Infrastructure Project",
    wardCount: 18,
    bias: {
      water: -3,
      sanitation: -4,
      electricity: 5,
      road: 2,
      drainage: -4,
      waste: -3,
    },
  },
  {
    key: "salem",
    query: "Salem",
    city: "Salem",
    displayName: "Salem Infrastructure Project",
    wardCount: 16,
    bias: {
      water: -5,
      sanitation: -6,
      electricity: 1,
      road: -3,
      drainage: -6,
      waste: -5,
    },
  },
  {
    key: "erode",
    query: "Erode",
    city: "Erode",
    displayName: "Erode Infrastructure Project",
    wardCount: 14,
    bias: {
      water: -4,
      sanitation: -5,
      electricity: 3,
      road: -2,
      drainage: -5,
      waste: -4,
    },
  },
] as const;

type CityConfig = (typeof CITY_CONFIGS)[number];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hashString(input: string) {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function severityFromPriority(priorityScore: number) {
  if (priorityScore >= 55) return "critical";
  if (priorityScore >= 40) return "high";
  if (priorityScore >= 25) return "moderate";
  return "stable";
}

function labelForService(
  service: "water" | "sanitation" | "electricity" | "road" | "drainage" | "waste"
) {
  const labels = {
    water: "Water Access",
    sanitation: "Sanitation",
    electricity: "Electricity",
    road: "Road Connectivity",
    drainage: "Drainage",
    waste: "Waste Management",
  };
  return labels[service];
}

function recommendationForService(
  service: "water" | "sanitation" | "electricity" | "road" | "drainage" | "waste"
) {
  const recommendations = {
    water: "Strengthen piped water coverage, community taps, and leakage control.",
    sanitation:
      "Improve household toilets, septic safety, and community sanitation access.",
    electricity:
      "Stabilize last-mile power reliability and formal household connections.",
    road: "Prioritize internal street surfacing and all-weather access corridors.",
    drainage:
      "Upgrade stormwater channels and recurring stagnation pockets first.",
    waste:
      "Improve door-to-door collection, segregation, and localized dumping control.",
  };
  return recommendations[service];
}

function weightedPriorityScore(scores: {
  water: number;
  sanitation: number;
  electricity: number;
  road: number;
  drainage: number;
  waste: number;
}) {
  const gaps = {
    water: Math.max(0, BENCHMARK_TARGETS.water - scores.water),
    sanitation: Math.max(0, BENCHMARK_TARGETS.sanitation - scores.sanitation),
    electricity: Math.max(
      0,
      BENCHMARK_TARGETS.electricity - scores.electricity
    ),
    road: Math.max(0, BENCHMARK_TARGETS.road - scores.road),
    drainage: Math.max(0, BENCHMARK_TARGETS.drainage - scores.drainage),
    waste: Math.max(0, BENCHMARK_TARGETS.waste - scores.waste),
  };

  const weighted =
    gaps.water * 0.22 +
    gaps.sanitation * 0.22 +
    gaps.electricity * 0.14 +
    gaps.road * 0.16 +
    gaps.drainage * 0.14 +
    gaps.waste * 0.12;

  return clamp(weighted, 0, 100);
}

function buildWardRecommendations(topDeficits: string[]) {
  return topDeficits.slice(0, 3).map((item) =>
    recommendationForService(
      item as
        | "water"
        | "sanitation"
        | "electricity"
        | "road"
        | "drainage"
        | "waste"
    )
  );
}

async function fetchCityBoundary(config: CityConfig) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("q", `${config.query}, Tamil Nadu, India`);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("polygon_geojson", "1");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("countrycodes", "in");
  endpoint.searchParams.set("limit", "8");
  endpoint.searchParams.set("dedupe", "1");

  const response = await fetch(endpoint.toString(), {
    headers: {
      "User-Agent": "HackOrbit/1.0 (student-hackathon)",
      "Accept-Language": "en",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Boundary fetch failed for ${config.city}`);
  }

  const results = await response.json();

  const match = (Array.isArray(results) ? results : []).find((item: any) => {
    const state = String(item?.address?.state || "").toLowerCase();
    const display = String(item?.display_name || "").toLowerCase();
    const type = item?.geojson?.type;

    const isTamilNadu =
      state.includes("tamil nadu") || display.includes("tamil nadu");

    const isPolygon = type === "Polygon" || type === "MultiPolygon";

    return isTamilNadu && isPolygon;
  });

  if (!match?.geojson) {
    throw new Error(`No valid full-boundary polygon found for ${config.city}`);
  }

  return {
    label: match.display_name,
    feature: {
      type: "Feature",
      properties: {
        city: config.city,
        source: "nominatim",
        display_name: match.display_name,
        osm_id: match.osm_id,
        osm_type: match.osm_type,
      },
      geometry: match.geojson,
    } as any,
  };
}

function createWardScores(
  config: CityConfig,
  cityBoundaryFeature: any,
  wardIndex: number
) {
  const centroid = turf.centroid(cityBoundaryFeature);
  const [lng, lat] = centroid.geometry.coordinates as [number, number];
  const seed = hashString(
    `${config.key}-${wardIndex}-${lng.toFixed(5)}-${lat.toFixed(5)}`
  );
  const rand = mulberry32(seed);

  const cityBias = config.bias;
  const eastWestBias = ((lng % 1) - 0.5) * 18;
  const northSouthBias = ((lat % 1) - 0.5) * 18;
  const mixedBias = (eastWestBias + northSouthBias) / 2;

  const scores = {
    water: clamp(46 + rand() * 28 + cityBias.water + eastWestBias * 0.35),
    sanitation: clamp(
      40 + rand() * 30 + cityBias.sanitation + northSouthBias * 0.4
    ),
    electricity: clamp(
      62 + rand() * 24 + cityBias.electricity + mixedBias * 0.18
    ),
    road: clamp(44 + rand() * 28 + cityBias.road + eastWestBias * 0.3),
    drainage: clamp(
      38 + rand() * 30 + cityBias.drainage + northSouthBias * 0.35
    ),
    waste: clamp(42 + rand() * 28 + cityBias.waste + mixedBias * 0.26),
  };

  const priorityScore = weightedPriorityScore(scores);
  const severity = severityFromPriority(priorityScore);

  const deficits = (
    Object.entries(scores) as Array<[keyof typeof scores, number]>
  ).map(([key, value]) => ({
    key,
    gap: Math.max(0, BENCHMARK_TARGETS[key] - value),
  }));

  deficits.sort((a, b) => b.gap - a.gap);

  const topDeficits = deficits.slice(0, 3).map((item) => item.key);

  const confidence = clamp(72 + rand() * 20);

  const households = Math.round(480 + rand() * 820);
  const population = Math.round(households * (3.2 + rand() * 1.3));

  return {
    scores,
    priorityScore,
    severity,
    topDeficits,
    confidence,
    households,
    population,
  };
}

function buildFallbackWardCollection(boundaryFeature: any, config: CityConfig) {
  const [minX, minY, maxX, maxY] = turf.bbox(boundaryFeature);
  const seed = hashString(`${config.key}-fallback`);
  const rand = mulberry32(seed);

  const cuts = [0];
  for (let i = 1; i < config.wardCount; i++) {
    cuts.push(i / config.wardCount + (rand() - 0.5) * 0.025);
  }
  cuts.push(1);

  const sortedCuts = cuts
    .map((item) => Math.max(0, Math.min(1, item)))
    .sort((a, b) => a - b);

  const wards: any[] = [];

  for (let i = 0; i < sortedCuts.length - 1; i++) {
    const start = sortedCuts[i];
    const end = sortedCuts[i + 1];
    const span = maxX - minX;

    const poly = turf.polygon([
      [
        [minX + start * span + (rand() - 0.5) * span * 0.03, minY],
        [minX + end * span + (rand() - 0.5) * span * 0.03, minY],
        [minX + end * span + (rand() - 0.5) * span * 0.03, maxY],
        [minX + start * span + (rand() - 0.5) * span * 0.03, maxY],
        [minX + start * span + (rand() - 0.5) * span * 0.03, minY],
      ],
    ]);

    const clipped = turf.intersect(
      turf.featureCollection([poly as any, boundaryFeature as any])
    ) as any;

    if (clipped?.geometry) {
      wards.push(clipped);
    }
  }

  return turf.featureCollection(wards);
}

function generateWardFeatureCollection(boundaryFeature: any, config: CityConfig) {
  const [minX, minY, maxX, maxY] = turf.bbox(boundaryFeature);
  const seed = hashString(`${config.key}-wards`);
  const rand = mulberry32(seed);

  const points: any[] = [turf.pointOnFeature(boundaryFeature)];
  const desiredPoints = config.wardCount + 8;

  let attempts = 0;
  while (points.length < desiredPoints && attempts < desiredPoints * 150) {
    const x = minX + (maxX - minX) * rand();
    const y = minY + (maxY - minY) * rand();
    const point = turf.point([x, y]);

    if (turf.booleanPointInPolygon(point, boundaryFeature)) {
      points.push(point);
    }
    attempts += 1;
  }

  let features: any[] = [];

  const voronoi = turf.voronoi(turf.featureCollection(points) as any, {
    bbox: [minX, minY, maxX, maxY],
  });

  if (voronoi?.features?.length) {
    const boundaryArea = turf.area(boundaryFeature);
    const minArea = boundaryArea / (config.wardCount * 60);

    voronoi.features.forEach((cell: any) => {
      if (!cell?.geometry) return;

      const clipped = turf.intersect(
        turf.featureCollection([cell as any, boundaryFeature as any])
      ) as any;

      if (!clipped?.geometry) return;
      if (turf.area(clipped) < minArea) return;

      features.push(clipped);
    });
  }

  if (features.length < Math.max(6, Math.floor(config.wardCount * 0.65))) {
    const fallback = buildFallbackWardCollection(boundaryFeature, config);
    features = fallback.features || [];
  }

  const sorted = [...features].sort((a, b) => {
    const [aLng, aLat] = turf.centroid(a).geometry.coordinates as [
      number,
      number
    ];
    const [bLng, bLat] = turf.centroid(b).geometry.coordinates as [
      number,
      number
    ];
    return bLat - aLat || aLng - bLng;
  });

  const finalFeatures = sorted.slice(0, config.wardCount).map((feature, index) => {
    const stats = createWardScores(config, feature, index);

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        ward_id: `${config.key}-ward-${String(index + 1).padStart(2, "0")}`,
        ward_name: `${config.city} Ward ${String(index + 1).padStart(2, "0")}`,
        __wardName: `${config.city} Ward ${String(index + 1).padStart(2, "0")}`,
        city: config.city,
        severity: stats.severity,
        priority_score: stats.priorityScore,
        confidence: stats.confidence,
        households: stats.households,
        population: stats.population,

        water_access: stats.scores.water,
        sanitation: stats.scores.sanitation,
        electricity: stats.scores.electricity,
        road: stats.scores.road,
        drainage: stats.scores.drainage,
        waste: stats.scores.waste,

        benchmark_water: BENCHMARK_TARGETS.water,
        benchmark_sanitation: BENCHMARK_TARGETS.sanitation,
        benchmark_electricity: BENCHMARK_TARGETS.electricity,
        benchmark_road: BENCHMARK_TARGETS.road,
        benchmark_drainage: BENCHMARK_TARGETS.drainage,
        benchmark_waste: BENCHMARK_TARGETS.waste,

        top_deficits: stats.topDeficits,
        recommended_actions: buildWardRecommendations(stats.topDeficits),
      },
    };
  });

  return turf.featureCollection(finalFeatures);
}

function buildSurveyPayload(wardCollection: any, config: CityConfig) {
  const rows = (wardCollection?.features || []).map((feature: any) => ({
    ward_id: feature.properties?.ward_id,
    ward_name: feature.properties?.ward_name,
    water_access: feature.properties?.water_access,
    sanitation: feature.properties?.sanitation,
    electricity: feature.properties?.electricity,
    road: feature.properties?.road,
    drainage: feature.properties?.drainage,
    waste: feature.properties?.waste,
    households: feature.properties?.households,
    population: feature.properties?.population,
    priority_score: feature.properties?.priority_score,
    severity: feature.properties?.severity,
  }));

  return {
    filename: `${config.key}-survey.json`,
    rowCount: rows.length,
    headers: [
      "ward_id",
      "ward_name",
      "water_access",
      "sanitation",
      "electricity",
      "road",
      "drainage",
      "waste",
      "households",
      "population",
      "priority_score",
      "severity",
    ],
    aliasMap: {
      ward_id: "ward_id",
      ward_name: "ward_name",
      water_access: "water_access",
      sanitation: "sanitation",
      electricity: "electricity",
      road: "road",
      drainage: "drainage",
      waste: "waste",
    },
    warnings: [],
    preview: rows.slice(0, 5),
    normalizedRows: rows,
    uploadedAt: new Date(),
  };
}

function buildAnalysisPayload(project: any, wardCollection: any) {
  const features = wardCollection?.features || [];

  const wardScores = features.map((feature: any) => {
    const props = feature.properties || {};

    const actualScores = {
      water: Number(props.water_access || 0),
      sanitation: Number(props.sanitation || 0),
      electricity: Number(props.electricity || 0),
      road: Number(props.road || 0),
      drainage: Number(props.drainage || 0),
      waste: Number(props.waste || 0),
    };

    const benchmarkTargets = {
      ...BENCHMARK_TARGETS,
    };

    const topDeficits = Array.isArray(props.top_deficits) ? props.top_deficits : [];

    return {
      wardId: props.ward_id,
      wardName: props.ward_name || props.__wardName || "Unnamed Ward",
      priorityScore: Number(props.priority_score || 0),
      severity: props.severity || "moderate",
      confidence: Number(props.confidence || 0),
      population: Number(props.population || 0),
      households: Number(props.households || 0),
      topDeficits,
      actualScores,
      benchmarkTargets,
      recommendedActions: Array.isArray(props.recommended_actions)
        ? props.recommended_actions
        : buildWardRecommendations(topDeficits),
    };
  });

  const total = wardScores.length || 1;

  const avg = (service: keyof typeof BENCHMARK_TARGETS) =>
    clamp(
      wardScores.reduce(
        (sum: number, item: any) => sum + Number(item.actualScores?.[service] || 0),
        0
      ) / total
    );

  const averageServiceScores = {
    water: avg("water"),
    sanitation: avg("sanitation"),
    electricity: avg("electricity"),
    road: avg("road"),
    drainage: avg("drainage"),
    waste: avg("waste"),
  };

  const averagePriorityScore = clamp(
    wardScores.reduce((sum: number, item: any) => sum + item.priorityScore, 0) / total
  );

  const averageConfidence = clamp(
    wardScores.reduce((sum: number, item: any) => sum + item.confidence, 0) / total
  );

  const globalSummary = {
    totalWards: wardScores.length,
    criticalWards: wardScores.filter((item: any) => item.severity === "critical")
      .length,
    highWards: wardScores.filter((item: any) => item.severity === "high").length,
    moderateWards: wardScores.filter((item: any) => item.severity === "moderate")
      .length,
    stableWards: wardScores.filter((item: any) => item.severity === "stable").length,
    averagePriorityScore,
    averageConfidence,
    averageServiceScores,
    benchmarkProfile: BENCHMARK_PROFILE,
    benchmarkLabel: BENCHMARK_LABEL,
    generatedAt: new Date().toISOString(),
  };

  const priorityInterventions = (
    Object.entries(averageServiceScores) as Array<
      [keyof typeof averageServiceScores, number]
    >
  )
    .map(([service, currentAverage]) => {
      const target = BENCHMARK_TARGETS[service];
      const gap = Math.max(0, target - currentAverage);

      return {
        service,
        label: labelForService(service),
        currentAverage,
        target,
        gap,
        urgency:
          gap >= 24 ? "critical" : gap >= 16 ? "high" : gap >= 8 ? "moderate" : "stable",
        estimatedScoreReduction: clamp(gap * 0.8, 0, 30),
        intervention:
          recommendationForService(
            service as
              | "water"
              | "sanitation"
              | "electricity"
              | "road"
              | "drainage"
              | "waste"
          ),
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const worstWards = [...wardScores]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5)
    .map((item) => item.wardName);

  const weakestServices = priorityInterventions.slice(0, 3).map((item) => item.label);

  const insights = {
    executiveSummary: `${project.name} indicates concentrated infrastructure pressure across ${globalSummary.totalWards} ward clusters, with highest urgency around ${weakestServices.join(
      ", "
    )}. The most affected wards currently include ${worstWards.join(", ")}.`,
    weakestServices,
    focusWards: worstWards,
    notes: [
      "This project uses full city boundary coverage stored in MongoDB.",
      "Ward polygons are irregular boundary-clipped units for hackathon visualization.",
      "Scores are city-wide synthetic planning values stored directly in DB for product demo flow.",
    ],
  };

  return {
    projectId: project._id,
    projectName: project.name,
    benchmarkProfile: BENCHMARK_PROFILE,
    benchmarkLabel: BENCHMARK_LABEL,
    globalSummary,
    wardScores,
    priorityInterventions,
    insights,
  };
}

function buildReportPayload(project: any, analysis: any) {
  return {
    projectId: project._id,
    analysisId: analysis._id,
    title: `${project.name} Infrastructure Gap Assessment`,
    executiveSummary:
      analysis.insights?.executiveSummary ||
      `${project.name} shows concentrated infrastructure gaps across priority wards, with the highest deficits clustered in water, sanitation, drainage, and local access conditions.`,
    methodology: [
      "Ward-level service values were generated and stored directly in MongoDB for demo flow.",
      "A full city boundary polygon was fetched and clipped into irregular ward-like planning units.",
      "Service adequacy was compared against benchmark targets for water, sanitation, electricity, road, drainage, and waste.",
      "Priority interventions were ranked by overall benchmark gap and likely score improvement.",
      "This report reflects the latest DB-backed city project state used by both map and details pages.",
    ],
    keyStats: analysis.globalSummary,
    wardFindings: analysis.wardScores.map((ward: any) => ({
      wardName: ward.wardName,
      priorityScore: ward.priorityScore,
      severity: ward.severity,
      confidence: ward.confidence,
      topDeficits: ward.topDeficits,
      actualScores: ward.actualScores,
      benchmarkTargets: ward.benchmarkTargets,
      recommendedActions: ward.recommendedActions,
    })),
    priorityActions: analysis.priorityInterventions,
    nextSteps: [
      "Validate highest-risk wards with field teams or municipal officers.",
      "Sequence quick-win interventions for severe wards before broader upgrades.",
      "Use ward comparison to prioritize medium-term capital planning.",
      "Refresh boundary-linked datasets when updated survey inputs are available.",
    ],
    generatedAt: new Date().toISOString(),
  };
}

async function upsertCityProject(config: CityConfig) {
  const fetched = await fetchCityBoundary(config);
  const cityOutlineFeature = fetched.feature;
  const wardCollection = generateWardFeatureCollection(cityOutlineFeature, config);
  const surveyPayload = buildSurveyPayload(wardCollection, config);

  let project = await Project.findOne({
    city: config.city,
    state: "Tamil Nadu",
  });

  if (!project) {
    project = await Project.create({
      name: config.displayName,
      city: config.city,
      state: "Tamil Nadu",
      country: "India",
      track: "societal",
      benchmarkProfile: BENCHMARK_PROFILE,
      status: "draft",
      survey: null,
      boundary: null,
      satellite: null,
      currentAnalysisId: null,
      latestReportId: null,
    });
  }

  await Analysis.deleteMany({ projectId: project._id });
  await Report.deleteMany({ projectId: project._id });

  project.name = config.displayName;
  project.city = config.city;
  project.state = "Tamil Nadu";
  project.country = "India";
  project.track = "societal";
  project.benchmarkProfile = BENCHMARK_PROFILE;
  project.status = "data_ready";
  project.survey = surveyPayload;
  project.boundary = {
    filename: `${config.key}-full-boundary.geojson`,
    featureCount: wardCollection.features.length,
    geojson: wardCollection,
    outlineGeojson: turf.featureCollection([cityOutlineFeature]),
    sourceLabel: fetched.label,
    uploadedAt: new Date(),
  };
  project.satellite = null;
  project.currentAnalysisId = null;
  project.latestReportId = null;

  await project.save();

  const analysisPayload = buildAnalysisPayload(project, wardCollection);

  const analysisDoc = await Analysis.create(analysisPayload);

  const reportPayload = buildReportPayload(
    {
      _id: String(project._id),
      name: project.name,
      city: project.city,
      state: project.state,
      country: project.country,
      benchmarkProfile: project.benchmarkProfile,
    },
    {
      _id: String(analysisDoc._id),
      globalSummary: analysisPayload.globalSummary,
      wardScores: analysisPayload.wardScores,
      priorityInterventions: analysisPayload.priorityInterventions,
      insights: analysisPayload.insights,
    }
  );

  const reportDoc = await Report.create(reportPayload);

  project.currentAnalysisId = analysisDoc._id;
  project.latestReportId = reportDoc._id;
  project.status = "reported";
  await project.save();

  return {
    cityKey: config.key,
    city: config.city,
    projectId: String(project._id),
    wards: wardCollection.features.length,
    analysisId: String(analysisDoc._id),
    reportId: String(reportDoc._id),
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const requestedCities = Array.isArray(body?.cities)
      ? body.cities.map((item: string) => String(item).toLowerCase().trim())
      : CITY_CONFIGS.map((item) => item.key);

    const selectedConfigs = CITY_CONFIGS.filter((item) =>
      requestedCities.includes(item.key)
    );

    if (!selectedConfigs.length) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid cities supplied.",
        },
        { status: 400 }
      );
    }

    const seeded: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < selectedConfigs.length; i++) {
      const config = selectedConfigs[i];

      try {
        if (i > 0) {
          await sleep(1200);
        }

        const result = await upsertCityProject(config);
        seeded.push(result);
      } catch (error) {
        failed.push({
          cityKey: config.key,
          city: config.city,
          error: error instanceof Error ? error.message : "Unknown city seed error",
        });
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      message:
        failed.length === 0
          ? "All selected city projects were inserted into MongoDB."
          : "Some cities were inserted, some failed.",
      seeded,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Seeding failed",
      },
      { status: 500 }
    );
  }
}