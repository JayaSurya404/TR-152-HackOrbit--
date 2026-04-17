import { CanonicalSurveyRow } from "@/lib/csv";
import { normalizeSatelliteSummary } from "@/lib/satellite";

type RawWardSeed = {
  wardName: string;
  water: number;
  sanitation: number;
  electricity: number;
  road: number;
  drainage: number;
  waste: number;
  householdSize: number;
  builtUpDensity: number;
  vegetationScarcity: number;
  waterStress: number;
  roadVisibility: number;
  confidence: number;
  polygon: number[][][];
};

const TRICHY_WARD_SEED: RawWardSeed[] = [
  {
    wardName: "Ward 1",
    water: 43,
    sanitation: 38,
    electricity: 66,
    road: 49,
    drainage: 30,
    waste: 35,
    householdSize: 6,
    builtUpDensity: 84,
    vegetationScarcity: 74,
    waterStress: 66,
    roadVisibility: 48,
    confidence: 84,
    polygon: [
      [
        [78.632, 10.781],
        [78.646, 10.780],
        [78.645, 10.792],
        [78.631, 10.793],
        [78.632, 10.781],
      ],
    ],
  },
  {
    wardName: "Ward 2",
    water: 49,
    sanitation: 44,
    electricity: 71,
    road: 54,
    drainage: 36,
    waste: 41,
    householdSize: 5,
    builtUpDensity: 77,
    vegetationScarcity: 68,
    waterStress: 58,
    roadVisibility: 54,
    confidence: 83,
    polygon: [
      [
        [78.646, 10.780],
        [78.659, 10.782],
        [78.661, 10.794],
        [78.645, 10.792],
        [78.646, 10.780],
      ],
    ],
  },
  {
    wardName: "Ward 3",
    water: 56,
    sanitation: 50,
    electricity: 77,
    road: 59,
    drainage: 43,
    waste: 47,
    householdSize: 5,
    builtUpDensity: 71,
    vegetationScarcity: 61,
    waterStress: 52,
    roadVisibility: 60,
    confidence: 84,
    polygon: [
      [
        [78.659, 10.782],
        [78.674, 10.781],
        [78.675, 10.793],
        [78.661, 10.794],
        [78.659, 10.782],
      ],
    ],
  },
  {
    wardName: "Ward 4",
    water: 64,
    sanitation: 58,
    electricity: 83,
    road: 65,
    drainage: 49,
    waste: 53,
    householdSize: 5,
    builtUpDensity: 66,
    vegetationScarcity: 56,
    waterStress: 47,
    roadVisibility: 64,
    confidence: 85,
    polygon: [
      [
        [78.674, 10.781],
        [78.688, 10.783],
        [78.689, 10.795],
        [78.675, 10.793],
        [78.674, 10.781],
      ],
    ],
  },
  {
    wardName: "Ward 5",
    water: 46,
    sanitation: 40,
    electricity: 69,
    road: 45,
    drainage: 33,
    waste: 39,
    householdSize: 6,
    builtUpDensity: 82,
    vegetationScarcity: 72,
    waterStress: 64,
    roadVisibility: 44,
    confidence: 82,
    polygon: [
      [
        [78.631, 10.793],
        [78.645, 10.792],
        [78.647, 10.804],
        [78.633, 10.805],
        [78.631, 10.793],
      ],
    ],
  },
  {
    wardName: "Ward 6",
    water: 53,
    sanitation: 47,
    electricity: 74,
    road: 56,
    drainage: 39,
    waste: 44,
    householdSize: 5,
    builtUpDensity: 75,
    vegetationScarcity: 66,
    waterStress: 57,
    roadVisibility: 55,
    confidence: 83,
    polygon: [
      [
        [78.645, 10.792],
        [78.661, 10.794],
        [78.660, 10.806],
        [78.647, 10.804],
        [78.645, 10.792],
      ],
    ],
  },
  {
    wardName: "Ward 7",
    water: 61,
    sanitation: 55,
    electricity: 80,
    road: 62,
    drainage: 46,
    waste: 50,
    householdSize: 5,
    builtUpDensity: 69,
    vegetationScarcity: 58,
    waterStress: 49,
    roadVisibility: 62,
    confidence: 84,
    polygon: [
      [
        [78.661, 10.794],
        [78.675, 10.793],
        [78.676, 10.804],
        [78.660, 10.806],
        [78.661, 10.794],
      ],
    ],
  },
  {
    wardName: "Ward 8",
    water: 74,
    sanitation: 68,
    electricity: 89,
    road: 72,
    drainage: 60,
    waste: 58,
    householdSize: 4,
    builtUpDensity: 55,
    vegetationScarcity: 44,
    waterStress: 36,
    roadVisibility: 72,
    confidence: 88,
    polygon: [
      [
        [78.675, 10.793],
        [78.689, 10.795],
        [78.690, 10.807],
        [78.676, 10.804],
        [78.675, 10.793],
      ],
    ],
  },
  {
    wardName: "Ward 9",
    water: 50,
    sanitation: 43,
    electricity: 72,
    road: 48,
    drainage: 36,
    waste: 40,
    householdSize: 6,
    builtUpDensity: 80,
    vegetationScarcity: 71,
    waterStress: 63,
    roadVisibility: 46,
    confidence: 82,
    polygon: [
      [
        [78.633, 10.805],
        [78.647, 10.804],
        [78.646, 10.816],
        [78.632, 10.817],
        [78.633, 10.805],
      ],
    ],
  },
  {
    wardName: "Ward 10",
    water: 58,
    sanitation: 52,
    electricity: 78,
    road: 60,
    drainage: 44,
    waste: 48,
    householdSize: 5,
    builtUpDensity: 72,
    vegetationScarcity: 63,
    waterStress: 55,
    roadVisibility: 58,
    confidence: 84,
    polygon: [
      [
        [78.647, 10.804],
        [78.660, 10.806],
        [78.662, 10.818],
        [78.646, 10.816],
        [78.647, 10.804],
      ],
    ],
  },
  {
    wardName: "Ward 11",
    water: 67,
    sanitation: 61,
    electricity: 85,
    road: 67,
    drainage: 53,
    waste: 55,
    householdSize: 4,
    builtUpDensity: 62,
    vegetationScarcity: 52,
    waterStress: 43,
    roadVisibility: 67,
    confidence: 86,
    polygon: [
      [
        [78.660, 10.806],
        [78.676, 10.804],
        [78.675, 10.817],
        [78.662, 10.818],
        [78.660, 10.806],
      ],
    ],
  },
  {
    wardName: "Ward 12",
    water: 79,
    sanitation: 73,
    electricity: 92,
    road: 76,
    drainage: 64,
    waste: 62,
    householdSize: 4,
    builtUpDensity: 50,
    vegetationScarcity: 39,
    waterStress: 32,
    roadVisibility: 75,
    confidence: 89,
    polygon: [
      [
        [78.676, 10.804],
        [78.690, 10.807],
        [78.689, 10.819],
        [78.675, 10.817],
        [78.676, 10.804],
      ],
    ],
  },
];

export function getDemoSeed() {
  const rawSurveyRows = TRICHY_WARD_SEED.map((ward) => ({
    ward: ward.wardName,
    water_access: String(ward.water),
    sanitation_access: String(ward.sanitation),
    electricity_access: String(ward.electricity),
    road_condition: String(ward.road),
    drainage_condition: String(ward.drainage),
    waste_disposal: String(ward.waste),
    household_size: String(ward.householdSize),
  }));

  const normalizedRows: CanonicalSurveyRow[] = TRICHY_WARD_SEED.map((ward) => ({
    wardName: ward.wardName,
    waterScore: ward.water,
    sanitationScore: ward.sanitation,
    electricityScore: ward.electricity,
    roadScore: ward.road,
    drainageScore: ward.drainage,
    wasteScore: ward.waste,
    householdSize: ward.householdSize,
    sourceRow: {
      ward: ward.wardName,
      water_access: ward.water,
      sanitation_access: ward.sanitation,
      electricity_access: ward.electricity,
      road_condition: ward.road,
      drainage_condition: ward.drainage,
      waste_disposal: ward.waste,
      household_size: ward.householdSize,
    },
  }));

  const boundaryGeoJson = {
    type: "FeatureCollection",
    features: TRICHY_WARD_SEED.map((ward) => ({
      type: "Feature",
      properties: {
        ward_name: ward.wardName,
      },
      geometry: {
        type: "Polygon",
        coordinates: ward.polygon,
      },
    })),
  };

  const satellite = normalizeSatelliteSummary({
    byWard: TRICHY_WARD_SEED.map((ward) => ({
      wardName: ward.wardName,
      builtUpDensity: ward.builtUpDensity,
      vegetationScarcity: ward.vegetationScarcity,
      waterStress: ward.waterStress,
      roadVisibility: ward.roadVisibility,
      confidence: ward.confidence,
    })),
  });

  return {
    project: {
      name: "Trichy Ward Demo",
      city: "Tiruchirappalli",
      state: "Tamil Nadu",
      country: "India",
      track: "societal",
      benchmarkProfile: "urban-slum-v1",
      status: "data_ready",
    },
    survey: {
      filename: "trichy-ward-survey.csv",
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
      filename: "trichy-wards.geojson",
      geojson: boundaryGeoJson,
      featureCount: boundaryGeoJson.features.length,
      wardPropertyKey: "ward_name",
      wardNames: TRICHY_WARD_SEED.map((ward) => ward.wardName),
      previewWardNames: TRICHY_WARD_SEED.map((ward) => ward.wardName),
      uploadedAt: new Date().toISOString(),
    },
    satellite,
  };
}