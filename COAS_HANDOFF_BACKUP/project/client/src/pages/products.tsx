import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter } from "lucide-react";

// Mock Data
const products = [
  { id: 1, name: "Modern Lever Handle L-204", category: "Door Hardware", price: "$45.00", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800" },
  { id: 2, name: "Solid Brass Knob K-11", category: "Cabinet Fittings", price: "$12.50", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=800" },
  { id: 3, name: "Glass Hinge H-90", category: "Glass Systems", price: "$32.00", image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800" },
  { id: 4, name: "Soft Close Slide S-500", category: "Furniture Parts", price: "$28.00", image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800" },
  { id: 5, name: "Minimalist Pull P-30", category: "Cabinet Fittings", price: "$15.00", image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800" },
  { id: 6, name: "Entrance Lockset E-100", category: "Door Hardware", price: "$120.00", image: "https://images.unsplash.com/photo-1517232863813-b0955a74a62b?auto=format&fit=crop&q=80&w=800" },
];

const BASE_URL = "https://e-coas.replit.app";

export default function Products() {
  return (
    <Layout>
      <Helmet>
        <title>제품 카탈로그 | E-COAS</title>
        <meta name="description" content="E-COAS의 다양한 인테리어 하드웨어 제품을 탐색하세요. 도어 하드웨어, 캐비닛 피팅, 유리 시스템, 가구 부품 등 프리미엄 제품군을 제공합니다." />
        <meta property="og:title" content="제품 카탈로그 | E-COAS" />
        <meta property="og:description" content="E-COAS의 다양한 인테리어 하드웨어 제품을 탐색하세요. 도어 하드웨어, 캐비닛 피팅, 유리 시스템, 가구 부품 등 프리미엄 제품군을 제공합니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/products`} />
      </Helmet>
      <div className="bg-muted/30 py-12 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Our Products</h1>
          <p className="text-muted-foreground max-w-2xl">Explore our extensive catalog of premium hardware. Use the filters to find exactly what you need for your project.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 space-y-8 shrink-0">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Filter className="h-4 w-4" /> Categories</h3>
              <div className="space-y-2">
                {["All Products", "Door Hardware", "Cabinet Fittings", "Glass Systems", "Furniture Parts", "Bathroom Accessories"].map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Checkbox id={cat} />
                    <label htmlFor={cat} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Finish</h3>
              <div className="space-y-2">
                {["Brushed Nickel", "Matte Black", "Chrome", "Polished Brass", "Antique Bronze"].map((finish) => (
                  <div key={finish} className="flex items-center space-x-2">
                    <Checkbox id={finish} />
                    <label htmlFor={finish} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {finish}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Price Range</h3>
              <Slider defaultValue={[33]} max={100} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$500+</span>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products..." className="pl-9" />
              </div>
              <Select defaultValue="featured">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">{product.category}</p>
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-semibold">{product.price}</span>
                      <Button size="sm" variant="secondary">Details</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12 flex justify-center">
              <Button variant="outline" size="lg">Load More Products</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
