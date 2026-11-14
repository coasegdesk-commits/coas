import { useState, useCallback, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Package, X } from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  categoryKo: string;
  description: string | null;
  descriptionKo: string | null;
  specifications: string | null;
  weightCapacity: string | null;
  pageNumber: string | null;
  imageUrl: string | null;
}

interface SearchResult {
  products: Product[];
  aiSummary?: string;
  aiSuggestion?: string;
  query: string;
  totalResults?: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "ko" | "en";
}

export function SearchModal({ isOpen, onClose, language = "ko" }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) trackEvent("search_opened", { language });
  }, [isOpen, language]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    trackEvent("search_submitted", { language });
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), language }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data);
      trackEvent("search_completed", {
        language,
        result_count: data.products.length,
        has_ai_summary: Boolean(data.aiSummary),
        has_ai_suggestion: Boolean(data.aiSuggestion),
      });
    } catch (err) {
      trackEvent("search_failed", { language });
      setError(language === "ko" ? "검색 중 오류가 발생했습니다." : "An error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  }, [query, language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#FF7B00]" />
            {language === "ko" ? "제품 검색" : "Product Search"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            data-testid="input-search"
            placeholder={language === "ko" ? "제품명, 카테고리, 사양 등으로 검색..." : "Search by product name, category, specifications..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            autoFocus
          />
          <Button
            data-testid="button-search"
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="bg-[#FF7B00] hover:bg-[#FF7B00]/90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm" data-testid="text-search-error">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {results && (
            <div className="space-y-4">
              {results.aiSummary && (
                <div className="p-4 bg-gradient-to-r from-[#FF7B00]/10 to-orange-50 rounded-lg border border-[#FF7B00]/20">
                  <p className="text-sm text-gray-700" data-testid="text-ai-summary">
                    <span className="font-semibold text-[#FF7B00]">AI: </span>
                    {results.aiSummary}
                  </p>
                </div>
              )}

              {results.aiSuggestion && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700" data-testid="text-ai-suggestion">
                    <span className="font-semibold text-blue-600">
                      {language === "ko" ? "추천: " : "Suggestion: "}
                    </span>
                    {results.aiSuggestion}
                  </p>
                </div>
              )}

              {results.totalResults !== undefined && (
                <p className="text-sm text-gray-500" data-testid="text-result-count">
                  {language === "ko" 
                    ? `${results.totalResults}개의 제품을 찾았습니다.`
                    : `Found ${results.totalResults} product(s).`
                  }
                </p>
              )}

              {results.products.length > 0 ? (
                <div className="grid gap-3">
                  {results.products.map((product) => (
                    <Link 
                      key={product.id} 
                      href={`/product/${product.id}`}
                      onClick={() => {
                        trackEvent("product_selected", {
                          product_id: product.id,
                          location: "search_results",
                          language,
                        });
                        handleClose();
                      }}
                    >
                      <div 
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:border-[#FF7B00]/50 hover:shadow-md transition-all cursor-pointer"
                        data-testid={`card-search-result-${product.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {language === "ko" ? product.nameKo : product.name}
                            </h3>
                            <p className="text-sm text-[#FF7B00]">
                              {language === "ko" ? product.categoryKo : product.category}
                            </p>
                            {(product.descriptionKo || product.description) && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {language === "ko" ? product.descriptionKo : product.description}
                              </p>
                            )}
                            {product.specifications && (
                              <p className="text-xs text-gray-400 mt-1">
                                {product.specifications}
                              </p>
                            )}
                          </div>
                          {product.pageNumber && (
                            <span className="text-xs text-[#FF7B00] font-medium bg-[#FF7B00]/10 px-2 py-1 rounded">
                              {product.pageNumber} p
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : results.products.length === 0 && !results.aiSuggestion && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{language === "ko" ? "검색 결과가 없습니다." : "No results found."}</p>
                </div>
              )}
            </div>
          )}

          {!results && !isLoading && (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{language === "ko" ? "검색어를 입력하세요" : "Enter a search term"}</p>
              <p className="text-xs mt-2">
                {language === "ko" 
                  ? "예: 슬라이딩도어, 80kg, DP-40, 레일" 
                  : "e.g., sliding door, 80kg, DP-40, rail"
                }
              </p>
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-4 text-left">
                코아스 검색 시스템은 Chat-GPT와 LLM을 활용한 검색 시스템으로 일반 AI와 같이 검색 하시면 원하시는 정보를 얻으실 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SearchButton({ onClick, language = "ko" }: { onClick: () => void; language?: "ko" | "en" }) {
  return (
    <button
      data-testid="button-open-search"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">
        {language === "ko" ? "검색" : "Search"}
      </span>
    </button>
  );
}
