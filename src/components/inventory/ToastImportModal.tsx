'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ToastImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: () => void; // Changed: backend handles sync now
  toastConfig?: { clientId?: string; clientSecret?: string; restaurantGuid?: string };
  mode?: 'sync' | 'edit';
  onCredentialsSaved?: (creds: { clientId: string; clientSecret: string; restaurantGuid: string }) => void;
}

export function ToastImportModal({ open, onClose, onImport, toastConfig, mode = 'edit', onCredentialsSaved }: ToastImportModalProps) {
  const [clientId, setClientId] = useState(toastConfig?.clientId || '');
  const [clientSecret, setClientSecret] = useState(toastConfig?.clientSecret || '');
  const [restaurantGuid, setRestaurantGuid] = useState(toastConfig?.restaurantGuid || '');
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; updated: number; deleted: number; menus: string[] } | null>(null);
  const [step, setStep] = useState<'credentials' | 'select_menus'>('credentials');
  const [availableMenus, setAvailableMenus] = useState<{ guid: string, name: string }[]>([]);
  const [selectedMenuGuids, setSelectedMenuGuids] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (toastConfig?.clientId) setClientId(toastConfig.clientId);
    if (toastConfig?.clientSecret) setClientSecret(toastConfig.clientSecret);
    if (toastConfig?.restaurantGuid) setRestaurantGuid(toastConfig.restaurantGuid);
  }, [toastConfig]);

  const handleFetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      if (saveCredentials && mode === 'edit') {
        await fetch('/api/site/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            integrations: {
              toast: { clientId, clientSecret, restaurantGuid }
            }
          }),
        }).catch(console.warn);
        
        if (onCredentialsSaved) {
          onCredentialsSaved({ clientId, clientSecret, restaurantGuid });
        }
      }

      const response = await fetch('/api/inventory/import/toast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, restaurantGuid, action: 'fetch_menus' }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch menus');

      setAvailableMenus(data.menus || []);
      setSelectedMenuGuids(new Set((data.menus || []).map((m: any) => m.guid)));
      setStep('select_menus');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {

      const response = await fetch('/api/inventory/import/toast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId, 
          clientSecret, 
          restaurantGuid, 
          action: 'sync', 
          menuGuids: Array.from(selectedMenuGuids) 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setResult({ added: data.added || 0, updated: data.updated || 0, deleted: data.deleted || 0, menus: data.menus || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport();
    handleClose();
  };

  const handleClose = () => {
    if (!toastConfig?.clientId) setClientId('');
    if (!toastConfig?.clientSecret) setClientSecret('');
    if (!toastConfig?.restaurantGuid) setRestaurantGuid('');
    setError(null);
    setResult(null);
    setStep('credentials');
    setAvailableMenus([]);
    setSelectedMenuGuids(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] z-[100] mt-8 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {mode === 'sync' ? 'Syncing Menu from Toast...' : 'Toast Settings & Sync'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'sync' 
              ? 'Please wait while we perfectly sync your menu. New items will be added, existing ones updated, and removed items deleted.'
              : 'Enter your Toast API credentials to perfectly sync your menu. New items will be added, existing ones updated, and removed items deleted.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              {step === 'credentials' && (
                <>
                  {mode === 'edit' && (
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

                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="saveCredentials" 
                      checked={saveCredentials}
                      onChange={(e) => setSaveCredentials(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="saveCredentials" className="text-sm font-normal cursor-pointer">
                      Save credentials for future syncs
                    </Label>
                  </div>
                </>
              )}
              </>
              )}

              {step === 'select_menus' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Select Menus to Sync</h3>
                  <p className="text-xs text-muted-foreground">
                    Only items from the selected menus will be synced. Any previously synced items that are not in the selected menus will be removed from your PortalPay inventory.
                  </p>
                  <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                    {availableMenus.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No menus found.</div>
                    ) : (
                      availableMenus.map(menu => (
                        <div key={menu.guid} className="flex items-center gap-3 p-3 hover:bg-neutral-50/5 cursor-pointer" onClick={() => {
                          const newSet = new Set(selectedMenuGuids);
                          if (newSet.has(menu.guid)) newSet.delete(menu.guid);
                          else newSet.add(menu.guid);
                          setSelectedMenuGuids(newSet);
                        }}>
                          <input 
                            type="checkbox" 
                            checked={selectedMenuGuids.has(menu.guid)}
                            onChange={() => {}} // Handled by div onClick
                            className="rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
                          />
                          <span className="text-sm font-medium">{menu.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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
                
                {step === 'credentials' ? (
                  <Button
                    onClick={handleFetchMenus}
                    disabled={loading || !clientId || !clientSecret || !restaurantGuid}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Fetch Menus
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={loading || selectedMenuGuids.size === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Sync Selected Menus
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully synced {result.menus.length} menu(s).
                  <div className="mt-2 text-sm font-medium">
                    {result.added} added, {result.updated} updated, {result.deleted} removed.
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Menus Processed:</Label>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {result.menus.map((menu, i) => (
                    <li key={i}>{menu}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={handleConfirmImport}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
