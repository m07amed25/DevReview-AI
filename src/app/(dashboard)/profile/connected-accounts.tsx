"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, ExternalLink, Loader2, Shield, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  providerId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface Provider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  description: string;
}

interface ProfileStats {
  repositories: number;
  reviews: number;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ConnectedAccountsCardProps {
  accounts: Account[];
  providers: Provider[];
  connectingProvider: string | null;
  disconnectTarget: { accountId: string; providerName: string } | null;
  setDisconnectTarget: (
    v: { accountId: string; providerName: string } | null,
  ) => void;
  onConnect: (providerId: string) => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  hasPassword: boolean;
}

export function ConnectedAccountsCard({
  accounts,
  providers,
  connectingProvider,
  disconnectTarget,
  setDisconnectTarget,
  onConnect,
  onDisconnect,
  isDisconnecting,
  hasPassword,
}: ConnectedAccountsCardProps) {
  const router = useRouter();

  const connectedCount = accounts.filter(
    (a) => a.providerId !== "credential",
  ).length;

  return (
    <>
      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold uppercase tracking-tight flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Shield className="size-4" />
                </div>
                Trust & Safety
              </CardTitle>
              <CardDescription>
                Third-party integrations and security methods
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Integrations</span>
              <span className="text-[10px] font-semibold text-indigo-500">{connectedCount} / {providers.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6 space-y-3">
          {providers.map((provider) => {
            const account = accounts.find((a) => a.providerId === provider.id);
            const isConnected = !!account;
            const isConnecting = connectingProvider === provider.id;
            const Icon = provider.icon;
            return (
              <div
                key={provider.id}
                className={cn(
                  "group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                  isConnected
                    ? "bg-white/5 border-green-500/10 hover:border-green-500/30 shadow-sm"
                    : "bg-neutral-50/50 dark:bg-neutral-900/50 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50"
                )}
              >
                {isConnected && (
                  <div className="absolute top-3 right-3 sm:hidden">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-green-500" />
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex shrink-0 items-center justify-center size-10 rounded-lg ${provider.color} transition-transform group-hover:scale-105`}
                  >
                    <Icon className={`size-5 ${provider.textColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{provider.name}</p>
                      {isConnected && (
                        <span className="hidden sm:inline-flex relative shrink-0">
                          <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full size-2 bg-green-500" />
                          </span>
                        </span>
                      )}
                    </div>
                    {isConnected ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <p className="text-xs text-muted-foreground truncate">
                          Connected{" "}
                          {account.createdAt
                            ? `on ${formatDate(account.createdAt)}`
                            : ""}
                        </p>
                        {account.updatedAt && (
                          <p className="text-xs text-muted-foreground/60 hidden sm:block">
                            · Last synced {formatDate(account.updatedAt)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {provider.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {isConnected ? (
                    <>
                      <Badge
                        variant="secondary"
                        className="hidden sm:flex gap-1 text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20"
                      >
                        <Check className="size-3" />
                        Connected
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                        onClick={() =>
                          setDisconnectTarget({
                            accountId: account.id,
                            providerName: provider.name,
                          })
                        }
                        title={`Disconnect ${provider.name}`}
                      >
                        <Unlink className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConnect(provider.id)}
                      disabled={isConnecting}
                      className="gap-2"
                    >
                      {isConnecting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="size-3.5" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <Separator className="my-2" />
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
            <Shield className="size-3.5 mt-0.5 shrink-0" />
            <p>
              Your account credentials are securely stored and encrypted.
              Disconnecting a provider will revoke its access but won&apos;t
              delete any data already synced.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          {(() => {
            const otherProviders = accounts.filter(
              (a) =>
                a.providerId !== "credential" &&
                a.id !== disconnectTarget?.accountId,
            );
            const isOnlyAuthMethod =
              !hasPassword && otherProviders.length === 0;
            return isOnlyAuthMethod ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-500">
                    <Shield className="size-5" />
                    Can&apos;t Disconnect {disconnectTarget?.providerName}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="block">
                      {disconnectTarget?.providerName} is your only way to sign
                      in. Disconnecting it would lock you out.
                    </span>
                    <span className="block mt-2">
                      To remove this connection, you can delete your account
                      from the Settings page.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      setDisconnectTarget(null);
                      router.push("/settings#danger-zone");
                    }}
                  >
                    Go to Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            ) : (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Disconnect {disconnectTarget?.providerName}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your {disconnectTarget?.providerName}{" "}
                    connection. You won&apos;t be able to sign in with{" "}
                    {disconnectTarget?.providerName} until you reconnect it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={onDisconnect}
                  >
                    {isDisconnecting ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Unlink className="size-4 mr-2" />
                    )}
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
