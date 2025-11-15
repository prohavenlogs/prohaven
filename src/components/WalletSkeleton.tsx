import { Skeleton } from "@/components/ui/skeleton";

export function QRCodeSkeleton() {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-white rounded-2xl p-6">
        <Skeleton className="w-[240px] h-[240px] animate-shimmer" />
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-full animate-shimmer" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 animate-shimmer" />
              <Skeleton className="h-3 w-32 animate-shimmer" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16 animate-shimmer" />
            <Skeleton className="h-5 w-20 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
