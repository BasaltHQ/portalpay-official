"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLowStockItems, useTeamMembers, useInventoryItems } from "@/lib/hooks/use-graphql";
import { DollarSign, Package, Users, AlertTriangle, RefreshCw } from "lucide-react";

type Density = "standard" | "compact";

interface WidgetDef {
  id: string;
  title: string;
  description?: string;
  render: () => React.ReactNode;
}

const ORDER_STORAGE_KEY = "dashboard_widgets_order";
const DENSITY_STORAGE_KEY = "dashboard_widgets_density";

function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

function OrdersTodayWidget() {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ revenue: number; ordersCompleted: number; avgOrderValue: number } | null>(null);

  const fetchData = React.useCallback(async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/toast/orders-metrics${force ? "?force=true" : ""}`);
      const json = await res.json();
      if (json?.success) setData(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const revenue = data?.revenue || 0;
  const orders = data?.ordersCompleted || 0;
  const aov = data?.avgOrderValue || 0;

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Today&apos;s Sales</CardTitle>
            <CardDescription>Completed orders and revenue</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchData(true)} aria-label="Refresh" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-orange/10 dark:bg-orange/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <DollarSign className="h-4 w-4 text-orange dark:text-orange" />
            </div>
            <div className="text-2xl font-semibold mt-1">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="p-3 rounded-lg bg-orange/10 dark:bg-orange/5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Orders</span>
              <Package className="h-4 w-4 text-orange dark:text-orange" />
            </div>
            <div className="text-2xl font-semibold mt-1">{orders}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-muted-foreground">Avg order value: ${aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </CardContent>
    </Card>
  );
}

function LowStockWidget() {
  const { data } = useLowStockItems();
  const items: Array<{ name?: string; quantity?: number; unit?: string }> = data?.lowStockItems || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Low Stock
        </CardTitle>
        <CardDescription>Items approaching reorder levels</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No low stock alerts</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between border rounded-md p-2">
                <div className="text-sm font-medium text-foreground">{it.name || "Item"}</div>
                <div className="text-xs text-muted-foreground">{typeof it.quantity === 'number' ? it.quantity : 0} {it.unit || ""}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveStaffWidget() {
  const [count, setCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/7shifts/active-shifts');
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json.data)) {
          const total = json.data.length || 0;
          setCount(total);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-success" />
          Active Staff
        </CardTitle>
        <CardDescription>Currently on shift</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold text-foreground">{loading ? "…" : count}</div>
      </CardContent>
    </Card>
  );
}

function InventoryOverviewWidget() {
  const { data } = useInventoryItems();
  const items = data?.inventoryItems || [];
  const total = items.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Inventory Items</CardTitle>
        <CardDescription>Tracked stock lines</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-semibold text-foreground">{total}</div>
        <div className="text-sm text-muted-foreground mt-1">Across all categories</div>
      </CardContent>
    </Card>
  );
}

export default function WidgetsGrid() {
  const [density, setDensity] = usePersistedState<Density>(DENSITY_STORAGE_KEY, "standard");

  const widgets: WidgetDef[] = React.useMemo(() => ([
    { id: "orders-today", title: "Today Sales", render: () => <OrdersTodayWidget /> },
    { id: "low-stock", title: "Low Stock", render: () => <LowStockWidget /> },
    { id: "active-staff", title: "Active Staff", render: () => <ActiveStaffWidget /> },
    { id: "inventory-overview", title: "Inventory Overview", render: () => <InventoryOverviewWidget /> },
  ]), []);

  const [order, setOrder] = usePersistedState<string[]>(ORDER_STORAGE_KEY, widgets.map(w => w.id));

  // Ensure order includes any new widgets
  React.useEffect(() => {
    const missing = widgets.map(w => w.id).filter(id => !order.includes(id));
    if (missing.length > 0) setOrder([...order, ...missing]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  const idToWidget = React.useMemo(() => Object.fromEntries(widgets.map(w => [w.id, w])), [widgets]);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/widget-id", id);
    setDraggingId(id);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData("text/widget-id");
    setDraggingId(null);
    if (!dragId || dragId === dropId) return;
    const current = [...order];
    const from = current.indexOf(dragId);
    const to = current.indexOf(dropId);
    if (from < 0 || to < 0) return;
    current.splice(from, 1);
    current.splice(to, 0, dragId);
    setOrder(current);
  };

  const gapClass = density === "compact" ? "gap-3" : "gap-6";
  const cardPadClass = density === "compact" ? "p-3" : "p-6";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Widgets</h2>
          <p className="text-sm text-muted-foreground">Drag cards to rearrange. Compact or standard density.</p>
        </div>
        <div className="inline-flex rounded-md border">
          <Button
            variant={density === "standard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDensity("standard")}
          >
            Standard
          </Button>
          <Button
            variant={density === "compact" ? "default" : "ghost"}
            size="sm"
            onClick={() => setDensity("compact")}
          >
            Compact
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${gapClass}`}>
        {order.filter(id => !!idToWidget[id]).map((id) => {
          const W = idToWidget[id];
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => onDragStart(e, id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, id)}
              className={`group rounded-lg border transition-shadow ${draggingId === id ? "ring-2 ring-ring" : ""}`}
            >
              <div className={cardPadClass}>
                {W.render()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


