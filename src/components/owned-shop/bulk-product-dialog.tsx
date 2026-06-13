"use client";

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import React, { useCallback, useState } from "react";

import { BulkProductInput } from "@/actions/product/product-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkProductsCreate } from "@/hooks/queries/useShopProducts";

import { SharedFileInput } from "../shared/shared-file-input";

export function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

interface BulkProductDialogProps {
  onSuccess?: () => void;
}

export function BulkProductDialog({ onSuccess }: BulkProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<BulkProductInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const { mutate: bulkCreate, isPending } = useBulkProductsCreate();

  const parseCSV = useCallback((content: string): BulkProductInput[] => {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headers = parseCSVRow(lines[0]).map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["name", "price"];

    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const parsed: BulkProductInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVRow(lines[i]).map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      if (!row.name || row.price === "") continue;

      const parsedPrice = Number(row.price);
      if (Number.isNaN(parsedPrice)) continue;

      const parsedStock = parseInt(row.stock_quantity || row.stock || "0", 10);
      const stock_quantity = !Number.isNaN(parsedStock) ? parsedStock : 0;

      let discount: number | undefined = undefined;
      if (row.discount) {
        const parsedDiscount = parseFloat(row.discount);
        if (!Number.isNaN(parsedDiscount)) {
          discount = parsedDiscount;
        }
      }

      parsed.push({
        name: row.name,
        description: row.description || undefined,
        price: parsedPrice,
        stock_quantity: stock_quantity,
        discount: discount,
        category: row.category || "",
      });
    }

    return parsed;
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setParseError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = parseCSV(content);
          if (parsed.length === 0) {
            setParseError("No valid products found in CSV");
            return;
          }
          if (parsed.length > 50) {
            setParseError(
              "Maximum 50 products per batch. Please split your file."
            );
            return;
          }
          setProducts(parsed);
        } catch (err) {
          setParseError(
            err instanceof Error ? err.message : "Failed to parse CSV"
          );
        }
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  const handleSubmit = () => {
    if (products.length === 0) return;

    bulkCreate(products, {
      onSuccess: () => {
        setOpen(false);
        setProducts([]);
        onSuccess?.();
      },
    });
  };

  const downloadTemplate = () => {
    const template =
      "name,description,price,stock_quantity,discount,category,brand\nProduct Name,Description here,1000,10,5,Category Name,Brand Name";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setProducts([]);
    setParseError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 h-11 px-6 rounded-xl border-border/60 hover:bg-muted/30 font-semibold text-xs transition-all duration-200 hover:scale-102 active:scale-98 cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-orange-500" />
          Bulk Import Products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border/30 rounded-2xl shadow-2xl p-6 sm:p-8">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Bulk Import Products
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium leading-relaxed">
            Upload a CSV file containing your product information to import
            multiple items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 px-4 rounded-lg border-border/60 hover:bg-muted/30 font-semibold text-xs cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={downloadTemplate}
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              Download CSV Template
            </Button>
            {products.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear File
              </Button>
            )}
          </div>

          {products.length === 0 ? (
            <SharedFileInput
              accept={"text/csv"}
              className="w-full"
              maxSize={5}
              onChange={(file) => {
                if (file) {
                  onDrop([file]);
                }
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold flex items-center justify-between">
                <span>CSV verified successfully</span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">
                  {products.length} Products Found
                </span>
              </div>

              <div className="border border-border/30 rounded-xl overflow-hidden max-h-64 overflow-y-auto shadow-inner bg-muted/5">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow className="hover:bg-transparent border-b border-border/20">
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground h-10">
                        Name
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground h-10">
                        Price
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground h-10">
                        Stock
                      </TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground h-10">
                        Category
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 10).map((product, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-muted/10 border-b border-border/10 transition-colors"
                      >
                        <TableCell className="font-semibold text-xs truncate max-w-[200px] text-foreground py-2.5">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground py-2.5">
                          ₹{product.price}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">
                          {product.stock_quantity}
                        </TableCell>
                        <TableCell className="py-2.5">
                          {product.category ? (
                            <Badge
                              variant="outline"
                              className="bg-indigo-500/5 text-indigo-600 border border-indigo-500/10 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/20 font-semibold text-[10px] rounded-full px-2 py-0"
                            >
                              {product.category}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {products.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center font-medium">
                  Showing first 10 of {products.length} products to import.
                </p>
              )}
            </div>
          )}

          {parseError && (
            <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
              {parseError}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t border-border/10 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-11 px-5 rounded-xl border-border/60 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={products.length === 0 || isPending}
            className="h-11 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer border-none shadow shadow-blue-500/10 disabled:bg-muted disabled:text-muted-foreground"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {products.length} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
