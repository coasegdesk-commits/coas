import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { trackEvent } from "@/lib/analytics";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCmsBootstrap } from "@/lib/cms";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Send,
} from "lucide-react";

const BASE_URL = "https://e-coas.replit.app";

export default function Contact() {
  const { cms } = useCmsBootstrap();
  const { company } = cms.design;
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "성함/담당자명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!phone.trim() && !email.trim()) {
      toast({
        title: "연락처 또는 이메일 중 하나를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "문의 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: companyName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          subject: subject.trim() || "제품 및 견적 문의",
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "문의 접수 중 오류가 발생했습니다.");
      }

      trackEvent("inquiry_submitted", { location: "contact_page" });
      setSubmitted(true);
      toast({
        title: "문의가 정상적으로 접수되었습니다.",
        description: "담당자가 확인 후 빠르게 연락드리겠습니다.",
      });
    } catch (err: any) {
      toast({
        title: "접수 실패",
        description: err.message || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setCompanyName("");
    setPhone("");
    setEmail("");
    setSubject("");
    setMessage("");
    setSubmitted(false);
  };

  return (
    <Layout>
      <Helmet>
        <title>문의하기 | E-COAS</title>
        <meta
          name="description"
          content="E-COAS에 제품 문의, 견적 요청, 기술 상담 등을 남겨주세요. 전문 상담팀이 빠르게 답변 드립니다."
        />
        <meta property="og:title" content="문의하기 | E-COAS" />
        <meta
          property="og:description"
          content="E-COAS에 제품 문의, 견적 요청, 기술 상담 등을 남겨주세요. 전문 상담팀이 빠르게 답변 드립니다."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/contact`} />
      </Helmet>

      <div className="bg-slate-900 text-white pt-28 pb-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#FF7B00] font-semibold text-sm tracking-widest uppercase mb-2">
            CONTACT US
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            제품 및 견적 문의
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            슬라이딩 도어, 댐핑 시스템, 레일 및 특수 하드웨어 제작·견적 문의를 남겨주시면 담당자가 신속히 안내해 드립니다.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 -mt-10">
        {/* Shortcut Banner to Dedicated Purchase Order Page */}
        <div className="mb-8 bg-gradient-to-r from-[#FF7B00] to-orange-500 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                품목 발주서 접수가 필요하신가요?
              </h2>
              <p className="text-sm text-white/90">
                모델 자동완성 입력 및 엑셀·도면·사진 파일 첨부가 가능한 전용 발주서 작성 페이지를 이용해 보세요.
              </p>
            </div>
          </div>
          <Link href="/order">
            <Button className="bg-white text-[#FF7B00] hover:bg-gray-100 font-bold px-6 shrink-0">
              발주서 작성 바로가기 →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-md border border-gray-100">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-[#FF7B00]/10 p-3 rounded-full text-[#FF7B00] shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    대표 전화 상담
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {company.businessHours}
                  </p>
                  <a
                    href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`}
                    onClick={() =>
                      trackEvent("contact_clicked", {
                        method: "phone",
                        location: "contact_page",
                      })
                    }
                    className="text-lg text-[#FF7B00] font-bold hover:underline"
                  >
                    {company.phone}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border border-gray-100">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-[#FF7B00]/10 p-3 rounded-full text-[#FF7B00] shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    이메일 문의
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    도면 검토 및 대량 발주 견적 문의 환영
                  </p>
                  <a
                    href={`mailto:${company.email}`}
                    onClick={() =>
                      trackEvent("contact_clicked", {
                        method: "email",
                        location: "contact_page",
                      })
                    }
                    className="text-[#FF7B00] font-semibold hover:underline break-all"
                  >
                    {company.email}
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card
              id="location"
              className="shadow-md border border-gray-100 scroll-mt-28"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-[#FF7B00]/10 p-3 rounded-full text-[#FF7B00] shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    사업장 위치 안내
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {company.address}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-md border border-gray-100 h-full">
              <CardContent className="p-8 md:p-10">
                {submitted ? (
                  <div className="py-12 text-center space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      문의가 정상적으로 접수되었습니다!
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      남겨주신 연락처로 담당자가 확인 후 신속하게 답변드리겠습니다. 감사합니다.
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                      <Button variant="outline" onClick={resetForm}>
                        추가 문의 작성하기
                      </Button>
                      <Link href="/parts-index">
                        <Button className="bg-[#FF7B00] hover:bg-[#e66f00] text-white">
                          부품 인덱스 둘러보기
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      온라인 상담 / 견적 문의
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      아래 양식을 작성해 주시면 관리자 페이지에 즉시 접수됩니다.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label
                            htmlFor="name"
                            className="text-sm font-medium text-gray-700"
                          >
                            담당자 성함 <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="홍길동"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="company"
                            className="text-sm font-medium text-gray-700"
                          >
                            업체명 / 현장명
                          </label>
                          <Input
                            id="company"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="(주)코아스인테리어"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label
                            htmlFor="phone"
                            className="text-sm font-medium text-gray-700"
                          >
                            연락처 <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="010-0000-0000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700"
                          >
                            이메일 주소
                          </label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@company.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="subject"
                          className="text-sm font-medium text-gray-700"
                        >
                          문의 제목
                        </label>
                        <Input
                          id="subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="예: DP-60 댐핑 시스템 단가 및 납기 문의"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-sm font-medium text-gray-700"
                        >
                          문의 내용 <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="문의하실 모델명, 수량, 도어 규격 또는 궁금하신 사항을 자유롭게 입력해 주세요."
                          className="min-h-[160px]"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={submitting}
                        className="w-full md:w-auto bg-[#FF7B00] hover:bg-[#e66f00] text-white font-bold px-8"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            접수 중...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            문의 접수하기
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
