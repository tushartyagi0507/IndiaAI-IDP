import { useState, useEffect, useCallback } from "react";
import { GripVertical, ArrowUpDown, Loader2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExtractionStore } from "@/store/extractionStore";
import { useToast } from "@/hooks/use-toast";
import useUserCategory from "@/store/userCategory";

interface FieldsResponse {
  document_id: string;
  fields: Record<string, string>;
}

const TableViewer = () => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<{
    headers: string[];
    rows: string[][];
  }>({
    headers: [],
    rows: [],
  });

  const document_id = useExtractionStore((state) => state.document_id);
  const currentDocument = useExtractionStore((state) => state.currentDocument);
  const { toast } = useToast();
  const { category } = useUserCategory();

  // Clear table data when document changes (no API call)
  useEffect(() => {
    setTableData({ headers: [], rows: [] });
  }, [document_id, currentDocument?.name]);

  const fetchDocumentFields = useCallback(async () => {
    if (!document_id || !currentDocument) {
      toast({
        title: "No document selected",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Missing category",
        description: "Category information is not available for this document.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8003/document/${document_id}/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            doc_type: category,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch document fields: ${response.statusText}`,
        );
      }

      const data: FieldsResponse = await response.json();

      const headers = Object.keys(data.fields);
      const row = Object.values(data.fields);

      setTableData({
        headers,
        rows: [row],
      });
    } catch (error) {
      console.error("Error fetching document fields:", error);
      toast({
        title: "Error loading fields",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load document fields.",
        variant: "destructive",
      });
      setTableData({ headers: [], rows: [] });
    } finally {
      setIsLoading(false);
    }
  }, [document_id, currentDocument, category, toast]);

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleSort = (colIndex: number) => {
    if (sortColumn === colIndex) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colIndex);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-emerald/10 text-emerald border-emerald/20";
      case "in progress":
        return "bg-primary/10 text-primary border-primary/20";
      case "planning":
        return "bg-navy/10 text-navy border-navy/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const sortedRows = [...tableData.rows].sort((a, b) => {
    if (sortColumn === null) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-display font-semibold">Extracted Tables</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchDocumentFields()}
          disabled={!document_id || !currentDocument || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Table2 className="w-4 h-4" />
          )}
          Extract
        </Button>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Loading document fields...
            </p>
          </div>
        ) : tableData.rows.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No fields have been extracted from this document yet. Once your
            extraction pipeline is connected, detected fields will be listed
            here.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {tableData.headers.map((header, index) => (
                  <th
                    key={index}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedCol === index && "bg-primary/5",
                    )}
                    onClick={() => handleSort(index)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3 h-3 opacity-30" />
                      {formatFieldName(header)}
                      <ArrowUpDown
                        className={cn(
                          "w-3 h-3 transition-opacity",
                          sortColumn === index
                            ? "opacity-100 text-primary"
                            : "opacity-30",
                        )}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-border/30 transition-colors cursor-pointer",
                    selectedRow === rowIndex
                      ? "bg-primary/5"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => setSelectedRow(rowIndex)}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-4 py-3 text-sm",
                        selectedCol === cellIndex && "bg-primary/5",
                      )}
                      onMouseEnter={() => setSelectedCol(cellIndex)}
                      onMouseLeave={() => setSelectedCol(null)}
                    >
                      {tableData.headers[cellIndex] === "Status" ? (
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border",
                            getStatusColor(cell),
                          )}
                        >
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TableViewer;
