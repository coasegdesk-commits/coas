import { useState, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CatalogRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogType: "standard" | "electronic";
}

export function CatalogRequestDialog({ open, onOpenChange, catalogType }: CatalogRequestDialogProps) {
  const { toast } = useToast();
  useEffect(() => {
    if (open) trackEvent("catalog_request_opened", { catalog_type: catalogType });
  }, [open, catalogType]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/catalog-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          catalogType: catalogType === "standard" ? "Standard Catalog" : "E-Catalog",
        }),
      });
      if (!response.ok) throw new Error("Failed to submit request");
      return response.json();
    },
    onSuccess: () => {
      trackEvent("catalog_request_completed", { catalog_type: catalogType });
      toast({
        title: "요청이 완료되었습니다",
        description: "카탈로그 요청이 성공적으로 접수되었습니다. 곧 연락드리겠습니다.",
      });
      onOpenChange(false);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
    },
    onError: () => {
      trackEvent("catalog_request_failed", { catalog_type: catalogType });
      toast({
        title: "오류가 발생했습니다",
        description: "요청 처리 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("catalog_request_submitted", { catalog_type: catalogType });
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {catalogType === "standard" ? "카탈로그 신청" : "전자카탈로그 신청"}
          </DialogTitle>
          <DialogDescription>
            정보를 입력하시면 빠른 시일 내에 카탈로그를 보내드리겠습니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="홍길동"
              data-testid="input-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              data-testid="input-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-1234-5678"
              data-testid="input-phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">회사명</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="회사명을 입력하세요"
              data-testid="input-company"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">메시지</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="추가 문의사항이 있으시면 작성해주세요"
              rows={3}
              data-testid="input-message"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[#FF7B00] hover:bg-[#FF7B00]/90"
              data-testid="button-submit"
            >
              {mutation.isPending ? "전송 중..." : "신청하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
