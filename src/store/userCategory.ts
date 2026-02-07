import { create } from "zustand";
import { persist } from "zustand/middleware";

type CategorySelectionLevel = "subcategory" | "subSubcategory";

const normalizeSelectionLabel = (value: string): string => {
  return value.trim().toLowerCase();
};

/**
 * Map the selected UI label (subcategory or sub-subcategory) to the backend
 * category key that must be stored as `category`.
 *
 * Notes:
 * - Some labels overlap (OBC/SC/ST) and resolve differently depending on whether
 *   they were chosen as a subcategory (ORA-Cell) or a sub-subcategory (SOAP-NIC).
 * - We intentionally support a few known label typos present in UI options.
 */
export const mapSelectionToCategoryKey = (
  label: string,
  level: CategorySelectionLevel,
): string => {
  const v = normalizeSelectionLabel(label);

  // Sub-subcategory (SOAP-NIC -> Community certificates)
  if (level === "subSubcategory") {
    if (v === "ews") return "ews";
    if (v === "obc") return "obc_soap";
    if (v === "sc") return "sc_soa";
    if (v === "st") return "st_soap";
    return v; // fallback
  }

  // Subcategory mappings (ORA-Cell + SOAP-NIC + PD Branch)
  // ORA-Cell
  if (v === "dob") return "dob";
  if (v === "education" || v === "educaiton") return "education";
  if (v === "experience") return "experience";
  if (v === "age_relaxation") return "age_relaxation";
  if (v === "professional_registration") return "professional";
  if (v === "sc") return "sc_ora";
  if (v === "st") return "st_ora";
  if (v === "obc") return "obc_ora";

  // SOAP-NIC
  if (v === "disability_certificates" || v === "disability_cetificates")
    return "disability";
  if (v === "matriculations") return "matriculation";
  if (v === "name change") return "name_change";
  if (v === "photo id") return "photo_id";
  if (v === "writing_extemity") return "writing_extremity";

  // PD Branch
  if (v === "Apar") return "apar";

  // Disciplinary Cases
  if (v === "Brief Background") return "brief_background";
  if (v === "CO Brief") return "co_brief";
  if (v === "IO Report") return "io_report";
  if (v === "PO Brief") return "po_brief";

  return v; // fallback
};

interface UserCategoryState {
  category: string;
  name: string;
  // Actions (Functions to change state)
  setCategoryStore: (newCategory: string) => void;
  setCategoryFromSelection: (
    label: string,
    level: CategorySelectionLevel,
  ) => void;
  resetCategory: () => void;
  getCategory: (state: UserCategoryState) => string;
}

const useUserCategory = create<UserCategoryState>()(
  persist(
    (set) => ({
      category: "",
      name: "",

      setCategoryStore: (newCategory) => set({ category: newCategory }),
      setCategoryFromSelection: (label, level) =>
        set({
          category: mapSelectionToCategoryKey(label, level),
          name: label,
        }),
      getCategory: (state: UserCategoryState) => state.category,
      resetCategory: () => set({ category: "", name: "" }),
    }),
    {
      name: "user-category-storage", // Key used in localStorage
    },
  ),
);

export default useUserCategory;
