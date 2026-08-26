"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportPrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="size-3.5" />
      Print / save as PDF
    </Button>
  );
}
