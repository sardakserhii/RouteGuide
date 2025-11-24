import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ALL_CATEGORIES } from "../config/constants";

interface UsePoiFilterModelProps {
  availableCategories?: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
  useAi: boolean;
  onUseAiChange: (useAi: boolean) => void;
  onApply?: () => void;
}

interface UsePoiFilterModelResult {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  showAllCategories: boolean;
  setShowAllCategories: (show: boolean) => void;
  pendingCategories: string[];
  setPendingCategories: (categories: string[]) => void;
  pendingMaxDistance: number | null;
  setPendingMaxDistance: (distance: number | null) => void;
  pendingUseAi: boolean;
  setPendingUseAi: (useAi: boolean) => void;
  handleCategoryToggle: (category: string) => void;
  handleSelectAll: () => void;
  handleClearAll: () => void;
  handleApply: () => void;
  t: (key: string, options?: any) => string;
}

export const usePoiFilterModel = ({
  availableCategories = ALL_CATEGORIES,
  selectedCategories,
  onCategoriesChange,
  maxDistance,
  onMaxDistanceChange,
  useAi,
  onUseAiChange,
  onApply,
}: UsePoiFilterModelProps): UsePoiFilterModelResult => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Local pending state; applies only after clicking "Apply filters"
  const [pendingCategories, setPendingCategories] =
    useState<string[]>(selectedCategories);
  const [pendingMaxDistance, setPendingMaxDistance] = useState<number | null>(
    maxDistance
  );
  const [pendingUseAi, setPendingUseAi] = useState<boolean>(useAi);

  // Keep pending state in sync if parent resets filters
  useEffect(() => {
    setPendingCategories(selectedCategories);
  }, [selectedCategories]);

  useEffect(() => {
    setPendingMaxDistance(maxDistance);
  }, [maxDistance]);

  useEffect(() => {
    setPendingUseAi(useAi);
  }, [useAi]);

  const handleCategoryToggle = useCallback((category: string) => {
    setPendingCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setPendingCategories(availableCategories);
  }, [availableCategories]);

  const handleClearAll = useCallback(() => {
    setPendingCategories([]);
  }, []);

  const handleApply = useCallback(() => {
    onCategoriesChange(pendingCategories);
    onMaxDistanceChange(pendingMaxDistance);
    onUseAiChange(pendingUseAi);
    if (onApply) onApply();
  }, [
    pendingCategories,
    pendingMaxDistance,
    pendingUseAi,
    onCategoriesChange,
    onMaxDistanceChange,
    onUseAiChange,
    onApply,
  ]);

  return {
    isExpanded,
    setIsExpanded,
    showAllCategories,
    setShowAllCategories,
    pendingCategories,
    setPendingCategories,
    pendingMaxDistance,
    setPendingMaxDistance,
    pendingUseAi,
    setPendingUseAi,
    handleCategoryToggle,
    handleSelectAll,
    handleClearAll,
    handleApply,
    t,
  };
};
