"use client";

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import React, { useCallback, useState } from "react";

import { BulkProductInput } from "@/actions/product/product-actions";
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

interface BulkProductDialogProps {
  onSuccess?: () => void;
}

export function BulkProductDialog({ onSuccess }: BulkProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<BulkProductInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const { mutate: bulkCreate, isPending } = useBulkProductsCreate();

  const parseCSV = useCallback((content: string): BulkProductInput[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredHeaders = ["name", "price"];

    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Missing required column: ${required}`);
      }
    }

    const parsed: BulkProductInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      if (!row.name || !row.price) continue;

      parsed.push({
        name: row.name,
        description: row.description,
        price: parseFloat(row.price) || 0,
        stock_quantity: parseInt(row.stock_quantity || row.stock || "0") || 0,
        discount: row.discount ? parseFloat(row.discount) : undefined,
        category: row.category,
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
      "name,description,price,stock_quantity,discount,category\nProduct Name,Description here,1000,10,5,Category Name";
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
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple products at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={downloadTemplate}
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>

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
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {products.length} products to import
                </p>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Clear
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.slice(0, 10).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium truncate max-w-[200px]">
                          {product.name}
                        </TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {products.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing first 10 of {products.length} products
                </p>
              )}
            </div>
          )}

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={products.length === 0 || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {products.length} Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
