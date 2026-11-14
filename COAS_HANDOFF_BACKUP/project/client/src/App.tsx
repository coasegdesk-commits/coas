import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products";
import NewProducts from "@/pages/new-products";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import PartsIndex from "@/pages/parts-index";
import PartsSpec from "@/pages/parts-spec";
import ProductDetail from "@/pages/product-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new-products" component={NewProducts} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/parts-index" component={PartsIndex} />
      <Route path="/parts-spec" component={PartsSpec} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
