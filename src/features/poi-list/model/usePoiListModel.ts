import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Poi, EnrichedPoi, CategoryOption } from "./types";
import { haversineDistance, deriveCategory } from "../lib/poiUtils";

interface UsePoiListModelProps {
  pois: Poi[];
  startPoint: [number, number] | null;
  onVisibleChange: (visiblePois: EnrichedPoi[]) => void;
}

interface UsePoiListModelResult {
  enrichedPois: EnrichedPoi[];
  categoryOptions: CategoryOption[];
  selectedCategories: string[];
  visiblePois: EnrichedPoi[];
  toggleCategory: (categoryKey: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

export const usePoiListModel = ({
  pois,
  startPoint,
  onVisibleChange,
}: UsePoiListModelProps): UsePoiListModelResult => {
  const { t } = useTranslation();

  const enrichedPois = useMemo(() => {
    if (!startPoint || !pois || pois.length === 0) return [];

    const [startLat, startLng] = startPoint;

    return [...pois]
      .map((poi) => {
        const distance = haversineDistance(
          startLat,
          startLng,
          poi.lat,
          poi.lon
        );
        const category = deriveCategory(poi);
        return { ...poi, distance, category };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [pois, startPoint]);

  const categoryOptions = useMemo(() => {
    const counts = enrichedPois.reduce((acc, poi) => {
      const key = poi.category || "other";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        label: t(`categories.${key}`, key),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [enrichedPois, t]);

  // Track manually deselected categories
  const [deselectedCategories, setDeselectedCategories] = useState<Set<string>>(
    new Set()
  );

  // Compute selected categories: all available except manually deselected ones
  const selectedCategories = useMemo(() => {
    return categoryOptions
      .map((c) => c.key)
      .filter((key) => !deselectedCategories.has(key));
  }, [categoryOptions, deselectedCategories]);

  const visiblePois = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return enrichedPois.filter((poi) =>
      selectedCategories.includes(poi.category)
    );
  }, [enrichedPois, selectedCategories]);

  useEffect(() => {
    onVisibleChange(visiblePois);
  }, [visiblePois, onVisibleChange]);

  const toggleCategory = (categoryKey: string) => {
    setDeselectedCategories((current) => {
      const newSet = new Set(current);
      if (current.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  return {
    enrichedPois,
    categoryOptions,
    selectedCategories,
    visiblePois,
    toggleCategory,
    t,
  };
};
