import { Skeleton } from "@/components/ui/skeleton"

export default function ContactLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32 md:col-span-2" />
          </div>
          <Skeleton className="h-[450px] w-full" />
        </div>
      </main>
    </div>
  )
}
