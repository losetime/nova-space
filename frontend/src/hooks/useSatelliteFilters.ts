import { ref, type Ref } from "vue";
import type { Satellite } from "./useLocalSatellites";
import { MISSION_CATEGORIES } from "@/constants/satellite";

export type OrbitType = "leo" | "meo" | "geo" | "heo";
export type FavoriteFilter = "favorited" | "unfavorited";

export interface SatelliteFiltersOptions {
  countries?: { code: string; count: number }[];
  missions?: { name: string; count: number }[];
  favoritedIds?: Ref<Set<string>>;
}

export function useSatelliteFilters(options: SatelliteFiltersOptions = {}) {
  const filterType = ref<string | null>(null);
  const selectedCountry = ref<string | null>(null);
  const selectedMission = ref<string | null>(null);
  const favoriteFilter = ref<string | null>(null);

  const countries = ref(options.countries || []);
  const missions = ref(options.missions || []);
  const favoritedIds = options.favoritedIds || ref(new Set());

  const orbitTypeLabel: Record<string, string> = {
    leo: "低轨 (LEO)",
    meo: "中轨 (MEO)",
    geo: "地球同步 (GEO)",
    heo: "高轨 (HEO)",
  };

  const favoriteLabel: Record<string, string> = {
    favorited: "已收藏",
    unfavorited: "未收藏",
  };

  const getOrbitTypeLabel = (type: string): string => orbitTypeLabel[type] || "全部轨道";
  const getFavoriteLabel = (filter: string): string => favoriteLabel[filter] || "全部";

  const filteredSatellites = (satellites: Satellite[]): Satellite[] => {
    let result = satellites;

    if (filterType.value) {
      result = result.filter((sat) => {
        if (sat.status === 'error') return false;
        const alt = sat.position?.alt ?? 0;
        if (filterType.value === "leo") return alt < 2000000;
        if (filterType.value === "meo") return alt >= 2000000 && alt < 35000000;
        if (filterType.value === "geo") return alt >= 35000000 && alt < 45000000;
        if (filterType.value === "heo") return alt >= 45000000;
        return true;
      });
    }

    if (selectedCountry.value) {
      result = result.filter((sat) => sat.countryCode === selectedCountry.value);
    }

    if (selectedMission.value) {
      const categorizeMission = (mission: string | undefined): string => {
        if (!mission) return "其他";
        return MISSION_CATEGORIES[mission] || "其他";
      };
      result = result.filter((sat) => categorizeMission(sat.mission) === selectedMission.value);
    }

    if (favoriteFilter.value === "favorited") {
      result = result.filter((sat) => favoritedIds.value.has(sat.noradId));
    } else if (favoriteFilter.value === "unfavorited") {
      result = result.filter((sat) => !favoritedIds.value.has(sat.noradId));
    }

    return result;
  };

  const resetFilters = () => {
    filterType.value = null;
    selectedCountry.value = null;
    selectedMission.value = null;
    favoriteFilter.value = null;
  };

  return {
    filterType,
    selectedCountry,
    selectedMission,
    favoriteFilter,
    countries,
    missions,
    favoritedIds,
    getOrbitTypeLabel,
    getFavoriteLabel,
    filteredSatellites,
    resetFilters,
  };
}
