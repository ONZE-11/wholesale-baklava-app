import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ProductDetailsLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 bg-gradient-to-br from-background via-amber-50/20 to-orange-50/30">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-6" />

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <Skeleton className="h-[500px] rounded-lg" />
            <div>
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-full mb-6" />
              <Skeleton className="h-16 w-48 mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
