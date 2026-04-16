import { CanonicalSurveyRow } from "@/lib/csv";
import { normalizeSatelliteSummary } from "@/lib/satellite";

export function getDemoSeed() {
  const rawSurveyRows = [
    {
      ward: "Ward 1",
      water_access: "42",
      sanitation_access: "38",
      electricity_access: "68",
      road_condition: "51",
      drainage_condition: "29",
      waste_disposal: "35",
      household_size: "6",
    },
    {
      ward: "Ward 2",
      water_access: "58",
      sanitation_access: "47",
      electricity_access: "74",
      road_condition: "57",
      drainage_condition: "44",
      waste_disposal: "41",
      household_size: "5",
    },
    {
      ward: "Ward 3",
      water_access: "76",
      sanitation_access: "69",
      electricity_access: "88",
      road_condition: "71",
      drainage_condition: "62",
      waste_disposal: "60",
      household_size: "4",
    },
    {
      ward: "Ward 4",
      water_access: "49",
      sanitation_access: "44",
      electricity_access: "79",
      road_condition: "39",
      drainage_condition: "33",
      waste_disposal: "36",
      household_size: "6",
    },
    {
      ward: "Ward 5",
      water_access: "66",
      sanitation_access: "59",
      electricity_access: "85",
      road_condition: "64",
      drainage_condition: "55",
      waste_disposal: "53",
      household_size: "5",
    },
    {
      ward: "Ward 6",
      water_access: "81",
      sanitation_access: "75",
      electricity_access: "92",
      road_condition: "74",
      drainage_condition: "67",
      waste_disposal: "65",
      household_size: "4",
    },
  ];

  const normalizedRows: CanonicalSurveyRow[] = rawSurveyRows.map((row) => ({
    wardName: row.ward,
    waterScore: Number(row.water_access),
    sanitationScore: Number(row.sanitation_access),
    electricityScore: Number(row.electricity_access),
    roadScore: Number(row.road_condition),
    drainageScore: Number(row.drainage_condition),
    wasteScore: Number(row.waste_disposal),
    householdSize: Number(row.household_size),
    sourceRow: row,
  }));

  const boundaryGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { ward_name: "Ward 1" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.680, 10.800], [78.690, 10.800], [78.690, 10.810], [78.680, 10.810], [78.680, 10.800]]],
        },
      },
      {
        type: "Feature",
        properties: { ward_name: "Ward 2" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.690, 10.800], [78.700, 10.800], [78.700, 10.810], [78.690, 10.810], [78.690, 10.800]]],
        },
      },
      {
        type: "Feature",
        properties: { ward_name: "Ward 3" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.700, 10.800], [78.710, 10.800], [78.710, 10.810], [78.700, 10.810], [78.700, 10.800]]],
        },
      },
      {
        type: "Feature",
        properties: { ward_name: "Ward 4" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.680, 10.810], [78.690, 10.810], [78.690, 10.820], [78.680, 10.820], [78.680, 10.810]]],
        },
      },
      {
        type: "Feature",
        properties: { ward_name: "Ward 5" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.690, 10.810], [78.700, 10.810], [78.700, 10.820], [78.690, 10.820], [78.690, 10.810]]],
        },
      },
      {
        type: "Feature",
        properties: { ward_name: "Ward 6" },
        geometry: {
          type: "Polygon",
          coordinates: [[[78.700, 10.810], [78.710, 10.810], [78.710, 10.820], [78.700, 10.820], [78.700, 10.810]]],
        },
      },
    ],
  };

  const satellite = normalizeSatelliteSummary({
    byWard: [
      {
        wardName: "Ward 1",
        builtUpDensity: 84,
        vegetationScarcity: 76,
        waterStress: 66,
        roadVisibility: 48,
        confidence: 82,
      },
      {
        wardName: "Ward 2",
        builtUpDensity: 73,
        vegetationScarcity: 68,
        waterStress: 58,
        roadVisibility: 56,
        confidence: 81,
      },
      {
        wardName: "Ward 3",
        builtUpDensity: 52,
        vegetationScarcity: 42,
        waterStress: 41,
        roadVisibility: 69,
        confidence: 84,
      },
      {
        wardName: "Ward 4",
        builtUpDensity: 79,
        vegetationScarcity: 71,
        waterStress: 64,
        roadVisibility: 45,
        confidence: 80,
      },
      {
        wardName: "Ward 5",
        builtUpDensity: 60,
        vegetationScarcity: 55,
        waterStress: 49,
        roadVisibility: 62,
        confidence: 83,
      },
      {
        wardName: "Ward 6",
        builtUpDensity: 44,
        vegetationScarcity: 35,
        waterStress: 31,
        roadVisibility: 74,
        confidence: 86,
      },
    ],
  });

  return {
    project: {
      name: "Tensor Demo Settlement",
      city: "Tiruchirappalli",
      state: "Tamil Nadu",
      country: "India",
      track: "societal",
      benchmarkProfile: "urban-slum-v1",
      status: "data_ready",
    },
    survey: {
      filename: "tensor-demo-survey.csv",
      headers: Object.keys(rawSurveyRows[0]),
      aliasMap: {
        wardName: "ward",
        waterScore: "water_access",
        sanitationScore: "sanitation_access",
        electricityScore: "electricity_access",
        roadScore: "road_condition",
        drainageScore: "drainage_condition",
        wasteScore: "waste_disposal",
        householdSize: "household_size",
      },
      rowCount: rawSurveyRows.length,
      rows: rawSurveyRows,
      normalizedRows,
      warnings: [],
      uploadedAt: new Date().toISOString(),
    },
    boundary: {
      filename: "tensor-demo-boundary.geojson",
      geojson: boundaryGeoJson,
      featureCount: boundaryGeoJson.features.length,
      wardPropertyKey: "ward_name",
      wardNames: boundaryGeoJson.features.map((item) => item.properties.ward_name),
      previewWardNames: boundaryGeoJson.features.map((item) => item.properties.ward_name),
      uploadedAt: new Date().toISOString(),
    },
    satellite,
  };
}