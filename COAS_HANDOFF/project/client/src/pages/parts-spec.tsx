import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";

const BASE_URL = "https://e-coas.replit.app";

export default function PartsSpec() {
  return (
    <Layout>
      <Helmet>
        <title>부품 생산제원표 | E-COAS</title>
        <meta name="description" content="E-COAS 슬라이딩 도어 시스템 부품 생산 규격 및 제원표. 슬라이딩 부품의 정확한 사양과 규격 정보를 확인하세요." />
        <meta property="og:title" content="부품 생산제원표 | E-COAS" />
        <meta property="og:description" content="E-COAS 슬라이딩 도어 시스템 부품 생산 규격 및 제원표. 슬라이딩 부품의 정확한 사양과 규격 정보를 확인하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/parts-spec`} />
      </Helmet>
      <div className="pt-20 pb-16 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" data-testid="text-page-title">
              슬라이딩 부품 생산제원표
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              슬라이딩 도어 시스템 부품 생산 규격 및 제원
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              준비 중입니다. 곧 상세 정보가 업데이트됩니다.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
