import { useState } from "react";
import { Download, GripVertical, ArrowUpDown, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TableViewer = () => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const tableData = {
    headers: ['Sector', 'Investment (₹ Cr)', 'Jobs Created', 'Status', 'Timeline'],
    rows: [
      ['Healthcare AI', '2,500', '125,000', 'In Progress', 'Q2 2025'],
      ['Agricultural Tech', '2,000', '100,000', 'Planning', 'Q3 2025'],
      ['Smart Cities', '3,000', '150,000', 'In Progress', 'Q4 2025'],
      ['Financial Services', '1,500', '75,000', 'Completed', 'Q1 2024'],
      ['Education Tech', '1,000', '50,000', 'Planning', 'Q4 2025'],
    ],
  };

  const handleSort = (colIndex: number) => {
    if (sortColumn === colIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colIndex);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald/10 text-emerald border-emerald/20';
      case 'in progress':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'planning':
        return 'bg-navy/10 text-navy border-navy/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const sortedRows = [...tableData.rows].sort((a, b) => {
    if (sortColumn === null) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-display font-semibold">Extracted Tables</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4 mr-2" />
            Expand
          </Button>
          <Button variant="saffron" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Table
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/30">
              {tableData.headers.map((header, index) => (
                <th
                  key={index}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedCol === index && "bg-primary/5"
                  )}
                  onClick={() => handleSort(index)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3 h-3 opacity-30" />
                    {header}
                    <ArrowUpDown className={cn(
                      "w-3 h-3 transition-opacity",
                      sortColumn === index ? "opacity-100 text-primary" : "opacity-30"
                    )} />
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
                    : "hover:bg-muted/30"
                )}
                onClick={() => setSelectedRow(rowIndex)}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-4 py-3 text-sm",
                      selectedCol === cellIndex && "bg-primary/5"
                    )}
                    onMouseEnter={() => setSelectedCol(cellIndex)}
                    onMouseLeave={() => setSelectedCol(null)}
                  >
                    {tableData.headers[cellIndex] === 'Status' ? (
                      <span className={cn(
                        "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border",
                        getStatusColor(cell)
                      )}>
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
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          {tableData.rows.length} rows × {tableData.headers.length} columns
        </p>
        <p className="text-xs text-muted-foreground">
          Click on a row to highlight • Drag column headers to resize
        </p>
      </div>
    </div>
  );
};

export default TableViewer;
