'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ToastImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: any[]) => void;
}

export function ToastImportModal({ open, onClose, onImport }: ToastImportModalProps) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [restaurantGuid, setRestaurantGuid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ itemCount: number; menus: string[] } | null>(null);
  const [importedItems, setImportedItems] = useState<any[]>([]);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/inventory/import/toast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, restaurantGuid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult({ itemCount: data.itemCount, menus: data.menus });
      setImportedItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(importedItems);
    handleClose();
  };

  const handleClose = () => {
    setClientId('');
    setClientSecret('');
    setRestaurantGuid('');
    setError(null);
    setResult(null);
    setImportedItems([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Menu from Toast
          </DialogTitle>
          <DialogDescription>
            Enter your Toast API credentials to import your menu items with modifiers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="restaurantGuid">Restaurant GUID</Label>
                <Input
                  id="restaurantGuid"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={restaurantGuid}
                  onChange={(e) => setRestaurantGuid(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Found in Toast Web → Administration → Location Setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="Your Toast Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Your Toast Client Secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You can obtain API credentials from the{' '}
                  <a
                    href="https://pos.toasttab.com/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    Toast Partner Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || !clientId || !clientSecret || !restaurantGuid}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Fetch Menu
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully fetched {result.itemCount} items from {result.menus.length} menu(s)
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Menus Found:</Label>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {result.menus.map((menu, i) => (
                    <li key={i}>{menu}</li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Click "Add to Inventory" to import these items. You can edit them individually after import.
              </p>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Add to Inventory ({result.itemCount} items)
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
