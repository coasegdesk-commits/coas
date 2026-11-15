import type {
  CmsProduct,
  NewProductItem,
  PartsSection,
  SidebarFilterCategory,
  SiteDesignSettings,
} from "./cms-types";

export const defaultDesign: SiteDesignSettings = {
  company: {
    name: "E-COAS (코아스)",
    logoUrl: "/attached_assets/코아스로고영문만_1766005232834.png",
    phone: "031)278-2201",
    email: "hmlee1125@naver.com",
    address: "경기도 화성시 인테리어하드웨어 단지 (관리자 페이지에서 상세주소 수정 가능)",
    businessHours: "평일 08:30 - 18:00 (점심 12:00 - 13:00 / 주말·공휴일 휴무)",
    footerDesc:
      "슬라이딩 도어, 댐핑 시스템, 유리 피팅, 알루미늄 레일 등 건축 및 인테리어 하드웨어 솔루션을 선도하는 전문 기업 코아스입니다.",
  },
  hero: {
    badgeText: "Premium Interior Hardware",
    titleLine1: "앞서가는 COAS와",
    titleLine2: "함께 하세요.",
    subtitle:
      "AI 검색으로 원하는 인테리어 부품을 빠르고 정확하게 찾아보세요.\n슬라이딩도어, 댐핑, 레일, 샤워부스, 큐비클, 유리파티션 등 전세계 모든 제품을 자연어로 검색할 수 있습니다.",
    bgImageUrl:
      "/attached_assets/generated_images/large_scale_interior_hardware_company_atmosphere.png",
    overlayOpacity: 75,
    primaryBtnText: "Explore Collections",
    primaryBtnHref: "/parts-index",
    orderBtnText: "발주서 작성",
    orderBtnHref: "/order",
  },
  categoriesSectionTitle: "Curated Categories",
  categoriesSectionSubtitle:
    "Discover our comprehensive range of high-end hardware solutions designed for modern living.",
  categories: [
    {
      id: "cat-door",
      title: "Door Hardware",
      desc: "Handles, Locks, Hinges",
      image:
        "/attached_assets/generated_images/close-up_of_a_sleek,_modern_brushed_metal_door_handle_on_a_high-quality_wooden_door..png",
      href: "/parts-index",
    },
    {
      id: "cat-cabinet",
      title: "Cabinet Fittings",
      desc: "Knobs, Pulls, Slides",
      image:
        "/attached_assets/generated_images/modern_kitchen_cabinet_hardware_detail..png",
      href: "/parts-index",
    },
    {
      id: "cat-glass",
      title: "Glass Systems",
      desc: "Patch Fittings, Showers",
      image: "/attached_assets/generated_images/glass_door_hardware_fittings..png",
      href: "/parts-index",
    },
    {
      id: "cat-furniture",
      title: "Furniture Parts",
      desc: "Legs, Castors, Connectors",
      image:
        "/attached_assets/generated_images/furniture_hardware_and_drawer_slides..png",
      href: "/parts-index",
    },
  ],
  featuredSectionTitle: "인기 제품",
  featuredProducts: [
    { id: "fp-1", productId: "sd-60", name: "60kg(SD)", page: "48 p", image: "/attached_assets/featured_master/featured_sd60.png" },
    { id: "fp-2", productId: "sd-80", name: "80kg(SD)", page: "50 p", image: "/attached_assets/featured_master/featured_sd80.png" },
    { id: "fp-3", productId: "m-80", name: "M-80", page: "54 p", image: "/attached_assets/featured_master/featured_m80.png" },
    { id: "fp-4", productId: "sd-150", name: "150kg(SD)", page: "56 p", image: "/attached_assets/featured_master/featured_sd150.png" },
    { id: "fp-5", productId: "dp-40", name: "DP-40", page: "24 p", image: "/attached_assets/featured_master/featured_dp40.png" },
    { id: "fp-6", productId: "dp-60", name: "DP-60", page: "26 p", image: "/attached_assets/featured_master/featured_dp60.png" },
    { id: "fp-7", productId: "gsd-60", name: "60kg(GSD)", page: "64 p", image: "/attached_assets/featured_master/featured_gsd60.png" },
    { id: "fp-8", productId: "fd-100", name: "100kg(FD)", page: "76 p", image: "/attached_assets/featured_master/featured_fd100.png" },
  ],
  ecatalog: {
    title: "E-COAS 종합 전자카탈로그",
    description:
      "슬라이딩 도어, 댐핑 시스템, SL 레일, 유리 피팅 등 코아스 주요 제품 제원 및 도면을 바로 열람하실 수 있습니다.",
    pdfUrl: null,
    pdfFileName: null,
    previewImages: [
      "/attached_assets/dp-20-22p_1766009769534.png",
      "/attached_assets/dp-40-24p_1766010281516.png",
      "/attached_assets/dp-60-26p_1766010790356.png",
      "/attached_assets/1body-40-60-28p_1766011601661.png",
      "/attached_assets/1body-90-32p_1766012196737.png",
      "/attached_assets/dp-100-34p_1766011106176.png",
      "/attached_assets/coas_페이지_048_1770322997387.png",
      "/attached_assets/coas_페이지_049_1770322997388.png",
      "/attached_assets/sliding-80Kg-50p_1766007601559.png",
      "/attached_assets/sliding-M80-54p_1766008725035.png",
      "/attached_assets/sliding-250Kg-60p_1766008978683.png",
      "/attached_assets/sliding-500Kg-62p_1766009149325.png",
    ],
    requireInfoForDownload: true,
  },
};

export const defaultNewProducts: NewProductItem[] = [
  {
    id: "np-1",
    productId: "sd-60",
    name: "60kg(SD)",
    desc: "60kg 하중 슬라이딩 도어 시스템",
    image: "/attached_assets/1-60kg-SD-48P_1765161288917.gif",
    wide: false,
    baseScale: 1.1,
    hoverScale: 1.3,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 0,
  },
  {
    id: "np-2",
    productId: "sd-80",
    name: "80kg(SD)",
    desc: "80kg 하중 슬라이딩 도어 시스템",
    image: "/attached_assets/2-80kg-SD-50P_1765161559365.gif",
    wide: false,
    baseScale: 1.1,
    hoverScale: 1.3,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 1,
  },
  {
    id: "np-3",
    productId: "m-80",
    name: "M-80",
    desc: "M-80 슬라이딩 도어 시스템",
    image: "/attached_assets/3-M-80-54p_1765161792190.png",
    wide: false,
    baseScale: 1.1,
    hoverScale: 1.3,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 2,
  },
  {
    id: "np-4",
    productId: "dp-40-wide",
    name: "DP-40",
    desc: "DP-40 댐핑 슬라이딩 도어",
    image: "/attached_assets/DP-40_1770327501473.png",
    wide: false,
    baseScale: 1.2,
    hoverScale: 1.44,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 3,
  },
  {
    id: "np-5",
    productId: "sd-200",
    name: "200kg(SD)",
    desc: "200kg 하중 슬라이딩 도어 시스템",
    image: "/attached_assets/DP-60_1770328862066.png",
    wide: false,
    baseScale: 1.1,
    hoverScale: 1.3,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 4,
  },
  {
    id: "np-6",
    productId: "gsd-60",
    name: "60kg(GSD)",
    desc: "60kg 유리 슬라이딩 도어",
    image: "/attached_assets/60kg(GSD)_1770329444630.png",
    wide: false,
    baseScale: 1.1,
    hoverScale: 1.3,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 5,
  },
  {
    id: "np-7",
    productId: "1body-40-60",
    name: "1 Body-40/60/90",
    desc: "원바디 슬라이딩 도어 시스템",
    image: "/attached_assets/1body-40-60-28p_1766011601661.png",
    wide: true,
    baseScale: 1.05,
    hoverScale: 1.2,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 6,
  },
  {
    id: "np-8",
    productId: "dp-60-wide",
    name: "DP-60",
    desc: "DP-60 댐핑 슬라이딩 도어 시스템",
    image: "/attached_assets/DP-60-2_1770330446962.png",
    wide: true,
    baseScale: 1.05,
    hoverScale: 1.2,
    showBadge: true,
    visible: true,
    showInNav: true,
    order: 7,
  },
];

export const defaultPartsSections: PartsSection[] = [
  {
    id: "sec-main",
    title: "슬라이딩 · 댐핑 · 폴딩 하드웨어",
    showHeader: false,
    headerColor: "dark",
    columns: 5,
    visible: true,
    order: 0,
    items: [
      // Row 0
      { id: "pi-sd-60", productId: "sd-60", name: "60kg(SD)", page: "48 p", image: "/attached_assets/1-60kg-SD-48P_1765161877020.gif", rowGroup: 0, visible: true },
      { id: "pi-sd-80", productId: "sd-80", name: "80kg(SD)", page: "50 p", image: "/attached_assets/sliding-80Kg-50p_1766007601559.png", rowGroup: 0, visible: true },
      { id: "pi-m-80", productId: "m-80", name: "M-80", page: "54 p", image: "/attached_assets/sliding-M80-54p_1766008725035.png", rowGroup: 0, visible: true },
      { id: "pi-sd-150", productId: "sd-150", name: "150kg(SD)", page: "56 p", image: "/attached_assets/sliding-150Kg-50p_1766008623356.png", rowGroup: 0, visible: true },
      { id: "pi-sd-250", productId: "sd-250", name: "250kg(SD)", page: "60 p", image: "/attached_assets/sliding-250Kg-60p_1766008978683.png", rowGroup: 0, visible: true },
      { id: "pi-sd-500", productId: "sd-500", name: "500kg(SD)", page: "62 p", image: "/attached_assets/sliding-500Kg-62p_1766009149325.png", rowGroup: 0, visible: true },
      { id: "pi-dp-20-wide", productId: "dp-20-wide", name: "DP-20", page: "22 p", image: "/attached_assets/dp-20-22p_1766009769534.png", wide: true, rowGroup: 0, visible: true },
      { id: "pi-dp-40-wide", productId: "dp-40-wide", name: "DP-40", page: "24 p", image: "/attached_assets/dp-40-24p_1766010281516.png", wide: true, rowGroup: 0, visible: true },
      // Row 1
      { id: "pi-dp-60-wide", productId: "dp-60-wide", name: "DP-60", page: "26 p", image: "/attached_assets/dp-60-26p_1766010790356.png", wide: true, rowGroup: 1, visible: true },
      { id: "pi-dp-100-wide", productId: "dp-100-wide", name: "DP-100", page: "34 p", image: "/attached_assets/dp-100-34p_1766011106176.png", wide: true, rowGroup: 1, visible: true },
      // Row 2
      { id: "pi-1body-40-60", productId: "1body-40-60", name: "1 Body-40/60", page: "28 p", subtitle: "상부롤러 8mm / 2구 롤러", image: "/attached_assets/1body-40-60-28p_1766011601661.png", wide: true, rowGroup: 2, visible: true },
      { id: "pi-1body-90", productId: "1body-90", name: "1 Body-90", page: "32 p", subtitle: "상부롤러 8mm / 2구 롤러", image: "/attached_assets/1body-90-32p_1766012196737.png", wide: true, rowGroup: 2, visible: true },
      // Row 3
      { id: "pi-gsd-60", productId: "gsd-60", name: "60kg(GSD)", page: "64 p", image: "/attached_assets/parts_images/part-028.png", rowGroup: 3, visible: true },
      { id: "pi-gsd-80", productId: "gsd-80", name: "80kg(GSD)", page: "66 p", image: "/attached_assets/parts_images/part-030.png", rowGroup: 3, visible: true },
      { id: "pi-gdp-100", productId: "gdp-100", name: "100kg(GDP)", page: "68 p", image: "/attached_assets/parts_images/part-032.png", rowGroup: 3, visible: true },
      { id: "pi-gsd-150", productId: "gsd-150", name: "150kg(GSD)", page: "70 p", image: "/attached_assets/parts_images/part-034.png", rowGroup: 3, visible: true },
      { id: "pi-fd-40", productId: "fd-40", name: "40kg(FD)", page: "74 p", image: "/attached_assets/parts_images/part-036.png", rowGroup: 3, visible: true },
      { id: "pi-fd-2", productId: "fd-2", name: "2구 (FD)", page: "72 p", image: "/attached_assets/parts_images/part-038.png", rowGroup: 3, visible: true },
      // Row 4
      { id: "pi-fd-100", productId: "fd-100", name: "100kg(FD)", page: "76 p", image: "/attached_assets/parts_images/part-040.png", rowGroup: 4, visible: true },
      { id: "pi-sd-200", productId: "sd-200", name: "200kg(SD)", page: "", image: "/attached_assets/parts_images/part-042.png", rowGroup: 4, visible: true },
      { id: "pi-msd-100", productId: "msd-100", name: "100kg(MSD)", page: "92 p", image: "/attached_assets/parts_images/part-044.png", rowGroup: 4, visible: true },
      { id: "pi-yl-202", productId: "yl-202", name: "YL-202", page: "78 p", image: "/attached_assets/parts_images/part-046.png", rowGroup: 4, visible: true },
      { id: "pi-yl-845", productId: "yl-845", name: "YL-845", page: "80 p", image: "/attached_assets/parts_images/part-048.png", rowGroup: 4, visible: true },
      // Row 5
      { id: "pi-wsd-yl960", productId: "wsd-yl960", name: "WSD-YL960", page: "86 p", image: "/attached_assets/parts_images/part-052.png", rowGroup: 5, visible: true },
      { id: "pi-wsd-yl970", productId: "wsd-yl970", name: "WSD-YL970", page: "88 p", image: "/attached_assets/parts_images/part-054.png", rowGroup: 5, visible: true },
      { id: "pi-sd-360", productId: "sd-360", name: "SD-360 (DP)", page: "82 p", image: "/attached_assets/parts_images/part-056.png", rowGroup: 5, visible: true },
      { id: "pi-sd-370", productId: "sd-370", name: "SD-370 (DP)", page: "84 p", image: "/attached_assets/parts_images/part-058.png", rowGroup: 5, visible: true },
      { id: "pi-ladder-1", productId: "ladder-1", name: "이동식사다리", page: "96 p", image: "/attached_assets/parts_images/part-060.png", rowGroup: 5, visible: true },
      { id: "pi-ladder-2", productId: "ladder-2", name: "이동식사다리", page: "96 p", image: "/attached_assets/parts_images/part-062.png", rowGroup: 5, visible: true },
    ],
  },
  {
    id: "sec-sl-rails",
    title: "SL 레일 시리즈",
    showHeader: true,
    headerColor: "dark",
    columns: 5,
    visible: true,
    order: 1,
    items: [
      { id: "pi-sl-2831", productId: "sl-2831", name: "SL-2831", page: "", subtitle: "60kg(SD)", image: "/attached_assets/parts_images/part-064.png", rowGroup: 0, visible: true },
      { id: "pi-sl-3332", productId: "sl-3332", name: "SL-3332", page: "", subtitle: "80kg(SD)", image: "/attached_assets/parts_images/part-066.png", rowGroup: 0, visible: true },
      { id: "pi-sl-3445", productId: "sl-3445", name: "SL-3445", page: "", subtitle: "80kg(SD)", image: "/attached_assets/parts_images/part-068.png", rowGroup: 0, visible: true },
      { id: "pi-sl-3540", productId: "sl-3540", name: "SL-3540", page: "", subtitle: "M-80 일반", image: "/attached_assets/parts_images/part-070.png", rowGroup: 0, visible: true },
      { id: "pi-sl-4550", productId: "sl-4550", name: "SL-4550", page: "", subtitle: "150kg(SD)", image: "/attached_assets/parts_images/part-072.png", rowGroup: 0, visible: true },

      { id: "pi-sl-4977", productId: "sl-4977", name: "SL-4977", page: "", subtitle: "150kg(SD) 벽체레일형", image: "/attached_assets/parts_images/part-074.png", rowGroup: 1, visible: true },
      { id: "pi-sl-4550-2", productId: "sl-4550-2", name: "SL-4550", page: "", subtitle: "250kg(SD)", image: "/attached_assets/parts_images/part-076.png", rowGroup: 1, visible: true },
      { id: "pi-sl-5544", productId: "sl-5544", name: "SL-5544", page: "", subtitle: "200kg(SD) 철롤러", image: "/attached_assets/parts_images/part-078.png", rowGroup: 1, visible: true },
      { id: "pi-sl-3337", productId: "sl-3337", name: "SL-3337", page: "", subtitle: "40, 60kg(DP)", image: "/attached_assets/parts_images/part-080.png", rowGroup: 1, visible: true },
      { id: "pi-sl-3032", productId: "sl-3032", name: "SL-3032", page: "", subtitle: "90kg(DP) 빌레스", image: "/attached_assets/parts_images/part-082.png", rowGroup: 1, visible: true },
      { id: "pi-sl-3032-2", productId: "sl-3032-2", name: "SL-3032", page: "", subtitle: "130kg(DP) 빌레스", image: "/attached_assets/parts_images/part-084.png", rowGroup: 1, visible: true },

      { id: "pi-sl-4953", productId: "sl-4953", name: "SL-4953", page: "", subtitle: "60kg(SD) 샤워부스", image: "/attached_assets/parts_images/part-086.png", rowGroup: 2, visible: true },
      { id: "pi-sl-3332-glass80", productId: "sl-3332-glass80", name: "SL-3332", page: "", subtitle: "80kg(SD) 유리", image: "/attached_assets/parts_images/part-088.png", rowGroup: 2, visible: true },
      { id: "pi-sl-4550-glass150", productId: "sl-4550-glass150", name: "SL-4550", page: "", subtitle: "150kg(SD) 유리", image: "/attached_assets/parts_images/part-090.png", rowGroup: 2, visible: true },
      { id: "pi-sl-3332-c80", productId: "sl-3332-c80", name: "SL-3332", page: "", subtitle: "C-80 반자동, 벨트", image: "/attached_assets/parts_images/part-092.png", rowGroup: 2, visible: true },
      { id: "pi-sl-3540-m80", productId: "sl-3540-m80", name: "SL-3540", page: "", subtitle: "M-80 반자동, 벨트", image: "/attached_assets/parts_images/part-094.png", rowGroup: 2, visible: true },
      { id: "pi-sl-3337-dp", productId: "sl-3337-dp", name: "SL-3337", page: "", subtitle: "40,60kg(DP) 반자동 벨트", image: "/attached_assets/parts_images/part-096.png", rowGroup: 2, visible: true },

      { id: "pi-sl-25", productId: "sl-25", name: "SL-25", page: "", subtitle: "φ25 2T SUS304", image: "/attached_assets/parts_images/part-098.png", rowGroup: 3, visible: true },
      { id: "pi-sl-3332-4fd", productId: "sl-3332-4fd", name: "SL-3332", page: "", subtitle: "4구(FD)", image: "/attached_assets/parts_images/part-100.png", rowGroup: 3, visible: true },
      { id: "pi-sl-3332-2fd", productId: "sl-3332-2fd", name: "SL-3332", page: "", subtitle: "2구(FD)", image: "/attached_assets/parts_images/part-102.png", rowGroup: 3, visible: true },
      { id: "pi-sl-5471", productId: "sl-5471", name: "SL-5471", page: "", subtitle: "FD100 / SD500", image: "/attached_assets/parts_images/part-104.png", rowGroup: 3, visible: true },
      { id: "pi-sl-6437", productId: "sl-6437", name: "SL-6437", page: "", subtitle: "큐비클 롤러(SD)", image: "/attached_assets/parts_images/part-106.png", rowGroup: 3, visible: true },
      { id: "pi-sl-3332-cubicle", productId: "sl-3332-cubicle", name: "SL-3332", page: "", subtitle: "큐비클 롤러", image: "/attached_assets/parts_images/part-108.png", rowGroup: 3, visible: true },

      { id: "pi-sl-1534", productId: "sl-1534", name: "SL-1534", page: "", subtitle: "액자레일 대", image: "/attached_assets/parts_images/part-110.png", rowGroup: 4, visible: true },
      { id: "pi-sl-1612", productId: "sl-1612", name: "SL-1612", page: "", subtitle: "액자레일 소", image: "/attached_assets/parts_images/part-112.png", rowGroup: 4, visible: true },
      { id: "pi-sl-5848", productId: "sl-5848", name: "SL-5848", page: "", subtitle: "100kg 무빙월", image: "/attached_assets/parts_images/part-114.png", rowGroup: 4, visible: true },
      { id: "pi-sl-3540-3", productId: "sl-3540-3", name: "SL-3540", page: "", subtitle: "3연동", image: "/attached_assets/parts_images/part-116.png", rowGroup: 4, visible: true },
      { id: "pi-sl-3338", productId: "sl-3338", name: "SL-3338", page: "", subtitle: "원바디 40, 60", image: "/attached_assets/parts_images/part-118.png", rowGroup: 4, visible: true },
      { id: "pi-sl-3538", productId: "sl-3538", name: "SL-3538", page: "", subtitle: "원바디 90", image: "/attached_assets/parts_images/part-120.png", rowGroup: 4, visible: true },

      { id: "pi-sl-3541", productId: "sl-3541", name: "SL-3541", page: "", subtitle: "100Kg (DP)", image: "/attached_assets/parts_images/part-122.png", rowGroup: 5, visible: true },
      { id: "pi-sl-1615", productId: "sl-1615", name: "SL-1615", page: "", subtitle: "하부레일 대", image: "/attached_assets/parts_images/part-124.png", rowGroup: 5, visible: true },
      { id: "pi-sl-1509", productId: "sl-1509", name: "SL-1509", page: "", subtitle: "하부레일 소", image: "/attached_assets/parts_images/part-126.png", rowGroup: 5, visible: true },
      { id: "pi-rail-cover-1", productId: "rail-cover-1", name: "원슬라이딩 레일+커버", page: "", image: "/attached_assets/parts_images/part-128.png", rowGroup: 5, visible: true },
      { id: "pi-rail-cover-2", productId: "rail-cover-2", name: "2연동 레일+커버", page: "", image: "/attached_assets/parts_images/part-130.png", rowGroup: 5, visible: true },
      { id: "pi-rail-cover-3", productId: "rail-cover-3", name: "벽체 카바형 레일+커버", page: "", image: "/attached_assets/parts_images/part-132.png", rowGroup: 5, visible: true },
    ],
  },
  {
    id: "sec-l-guides",
    title: "L형 가이드",
    showHeader: true,
    headerColor: "orange",
    columns: 4,
    visible: true,
    order: 2,
    items: [
      { id: "pi-sd-01-fe", productId: "sd-01-fe", name: "SD-01(철)", page: "41 p", subtitle: "L형 가이드", image: "/attached_assets/parts_images/part-134.png", rowGroup: 0, visible: true },
      { id: "pi-sd-01-al", productId: "sd-01-al", name: "SD-01(AL)", page: "41 p", subtitle: "L형 가이드", image: "/attached_assets/parts_images/part-136.png", rowGroup: 0, visible: true },
      { id: "pi-sd-02-fe", productId: "sd-02-fe", name: "SD-02(철)", page: "41 p", subtitle: "L형 가이드", image: "/attached_assets/parts_images/part-138.png", rowGroup: 0, visible: true },
      { id: "pi-sd-02-al", productId: "sd-02-al", name: "SD-02(AL)", page: "41 p", subtitle: "L형 가이드", image: "/attached_assets/parts_images/part-140.png", rowGroup: 0, visible: true },
    ],
  },
];

export const defaultSidebarFilters: SidebarFilterCategory[] = [
  {
    id: "sf-sliding",
    title: "슬라이딩",
    expanded: true,
    subItems: [
      { id: "sfi-1", label: "SD-60", href: "/product/sd-60" },
      { id: "sfi-2", label: "SD-80", href: "/product/sd-80" },
      { id: "sfi-3", label: "M-80", href: "/product/m-80" },
      { id: "sfi-4", label: "SD-150", href: "/product/sd-150" },
      { id: "sfi-5", label: "SD-250", href: "/product/sd-250" },
      { id: "sfi-6", label: "SD-500", href: "/product/sd-500" },
      { id: "sfi-7", label: "DP-20", href: "/product/dp-20-wide" },
      { id: "sfi-8", label: "DP-40", href: "/product/dp-40-wide" },
      { id: "sfi-9", label: "DP-60", href: "/product/dp-60-wide" },
      { id: "sfi-10", label: "DP-100", href: "/product/dp-100-wide" },
    ],
  },
  {
    id: "sf-shower",
    title: "샤워부스",
    subItems: [
      { id: "sfi-11", label: "SD-09", href: "/product/sd-09" },
      { id: "sfi-12", label: "SD-10 ~ SD-15", href: "/product/sd-10" },
      { id: "sfi-13", label: "SL-531 ~ SL-538", href: "/product/sl-531" },
    ],
  },
  {
    id: "sf-cubicle",
    title: "큐비클",
    subItems: [
      { id: "sfi-14", label: "CD-101", href: "/product/cd-101" },
      { id: "sfi-15", label: "CD-310 유압힌지", href: "/product/cd-310" },
      { id: "sfi-16", label: "CD-905 각도조절형", href: "/product/cd-905-adj" },
    ],
  },
  {
    id: "sf-glass",
    title: "유리파티션",
    subItems: [
      { id: "sfi-17", label: "60kg(GSD)", href: "/product/gsd-60" },
      { id: "sfi-18", label: "80kg(GSD)", href: "/product/gsd-80" },
      { id: "sfi-19", label: "100kg(GDP)", href: "/product/gdp-100" },
      { id: "sfi-20", label: "150kg(GSD)", href: "/product/gsd-150" },
    ],
  },
  {
    id: "sf-continuous",
    title: "컨틴뉘우스",
    subItems: [
      { id: "sfi-21", label: "CP-510 ~ CP-600", href: "/product/cp-510" },
    ],
  },
  {
    id: "sf-hinge",
    title: "정첩시스템",
    subItems: [
      { id: "sfi-22", label: "CH-110", href: "/product/ch-110" },
      { id: "sfi-23", label: "CT-110 도어클로저", href: "/product/ct-110" },
    ],
  },
  {
    id: "sf- rail",
    title: "SL 레일 시리즈",
    subItems: [
      { id: "sfi-24", label: "SL 레일 전체 보기", href: "/parts-index#sec-sl-rails" },
      { id: "sfi-25", label: "SL-2831", href: "/product/sl-2831" },
      { id: "sfi-26", label: "SL-3332", href: "/product/sl-3332" },
      { id: "sfi-27", label: "SL-3445", href: "/product/sl-3445" },
      { id: "sfi-28", label: "SL-3540", href: "/product/sl-3540" },
      { id: "sfi-29", label: "SL-4550", href: "/product/sl-4550" },
    ],
  },
  {
    id: "sf-guide",
    title: "L형 가이드",
    subItems: [
      { id: "sfi-30", label: "L형 가이드 전체 보기", href: "/parts-index#sec-l-guides" },
      { id: "sfi-31", label: "SD-01(철/AL)", href: "/product/sd-01-fe" },
      { id: "sfi-32", label: "SD-02(철/AL)", href: "/product/sd-02-fe" },
    ],
  },
];

// Build image lookup from all sections + special high-res images
const partImageByProductId: Record<string, string> = {};
for (const sec of defaultPartsSections) {
  for (const item of sec.items) {
    if (!partImageByProductId[item.productId]) {
      partImageByProductId[item.productId] = item.image;
    }
  }
}
partImageByProductId["dp-20"] = "/attached_assets/dp-20-22p_1766009769534.png";
partImageByProductId["dp-40"] = "/attached_assets/DP-40_1770327501473.png";
partImageByProductId["dp-60"] = "/attached_assets/DP-60_1770328862066.png";
partImageByProductId["dp-100"] = "/attached_assets/dp-100-34p_1766011106176.png";
partImageByProductId["dp-20-wide"] = "/attached_assets/dp-20-22p_1766009769534.png";
partImageByProductId["dp-40-wide"] = "/attached_assets/dp-40-24p_1766010281516.png";
partImageByProductId["dp-60-wide"] = "/attached_assets/DP-60_1770328862066.png";
partImageByProductId["dp-100-wide"] = "/attached_assets/dp-100-34p_1766011106176.png";
partImageByProductId["gsd-60"] = "/attached_assets/60kg(GSD)_1770329444630.png";

interface RawSeed {
  id: string;
  name: string;
  nameKo: string;
  category: string;
  categoryKo: string;
  description?: string;
  descriptionKo?: string;
  specifications?: string;
  weightCapacity?: string;
  pageNumber?: string;
  searchText?: string;
  imageUrl?: string;
  detailImages?: string[];
}

const rawProducts: RawSeed[] = [
  // Sliding Door (SD) Series
  {
    id: "sd-60",
    name: "60kg(SD)",
    nameKo: "60kg 슬라이딩도어",
    category: "Sliding Door",
    categoryKo: "슬라이딩도어",
    description: "60kg capacity sliding door hardware",
    descriptionKo: "60kg 용량 슬라이딩도어 하드웨어",
    weightCapacity: "60kg",
    pageNumber: "48",
    searchText: "60kg sd sliding door 슬라이딩도어 슬라이딩 도어",
    detailImages: [
      "/attached_assets/coas_페이지_048_1770322997387.png",
      "/attached_assets/coas_페이지_049_1770322997388.png",
    ],
  },
  { id: "sd-80", name: "80kg(SD)", nameKo: "80kg 슬라이딩도어", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "80kg capacity sliding door hardware", descriptionKo: "80kg 용량 슬라이딩도어 하드웨어", weightCapacity: "80kg", pageNumber: "50", searchText: "80kg sd sliding door 슬라이딩도어 슬라이딩 도어" },
  { id: "m-80", name: "M-80", nameKo: "M-80", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "M-80 sliding door hardware", descriptionKo: "M-80 슬라이딩도어 하드웨어", weightCapacity: "80kg", pageNumber: "54", searchText: "m-80 m80 sliding door 슬라이딩도어" },
  { id: "sd-150", name: "150kg(SD)", nameKo: "150kg 슬라이딩도어", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "150kg capacity sliding door hardware for heavy doors", descriptionKo: "150kg 용량 대형 슬라이딩도어 하드웨어", weightCapacity: "150kg", pageNumber: "56", searchText: "150kg sd sliding door 슬라이딩도어 heavy 대형" },
  { id: "sd-250", name: "250kg(SD)", nameKo: "250kg 슬라이딩도어", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "250kg capacity sliding door hardware for heavy doors", descriptionKo: "250kg 용량 대형 슬라이딩도어 하드웨어", weightCapacity: "250kg", pageNumber: "60", searchText: "250kg sd sliding door 슬라이딩도어 heavy 대형" },
  { id: "sd-500", name: "500kg(SD)", nameKo: "500kg 슬라이딩도어", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "500kg capacity sliding door hardware for extra heavy doors", descriptionKo: "500kg 용량 초대형 슬라이딩도어 하드웨어", weightCapacity: "500kg", pageNumber: "62", searchText: "500kg sd sliding door 슬라이딩도어 heavy 초대형" },
  { id: "sd-200", name: "200kg(SD)", nameKo: "200kg 슬라이딩도어", category: "Sliding Door", categoryKo: "슬라이딩도어", description: "200kg capacity sliding door hardware", descriptionKo: "200kg 용량 슬라이딩도어 하드웨어", weightCapacity: "200kg", pageNumber: "", searchText: "200kg sd sliding door 슬라이딩도어" },

  // Damping (DP) Series + Wide aliases
  { id: "dp-20", name: "DP-20", nameKo: "DP-20 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-20 damping system", descriptionKo: "DP-20 댐핑 시스템", weightCapacity: "20kg", pageNumber: "22", searchText: "dp-20 dp20 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-20-wide", name: "DP-20", nameKo: "DP-20 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-20 damping system", descriptionKo: "DP-20 댐핑 시스템", weightCapacity: "20kg", pageNumber: "22", searchText: "dp-20 dp20 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-40", name: "DP-40", nameKo: "DP-40 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-40 damping system", descriptionKo: "DP-40 댐핑 시스템", weightCapacity: "40kg", pageNumber: "24", searchText: "dp-40 dp40 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-40-wide", name: "DP-40", nameKo: "DP-40 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-40 damping system", descriptionKo: "DP-40 댐핑 시스템", weightCapacity: "40kg", pageNumber: "24", searchText: "dp-40 dp40 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-60", name: "DP-60", nameKo: "DP-60 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-60 damping system", descriptionKo: "DP-60 댐핑 시스템", weightCapacity: "60kg", pageNumber: "26", searchText: "dp-60 dp60 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-60-wide", name: "DP-60", nameKo: "DP-60 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-60 damping system", descriptionKo: "DP-60 댐핑 시스템", weightCapacity: "60kg", pageNumber: "26", searchText: "dp-60 dp60 damping 댐핑 소프트클로징 soft close" },
  { id: "dp-100", name: "DP-100", nameKo: "DP-100 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-100 damping system for heavy doors", descriptionKo: "DP-100 대형 댐핑 시스템", weightCapacity: "100kg", pageNumber: "34", searchText: "dp-100 dp100 damping 댐핑 소프트클로징 soft close heavy" },
  { id: "dp-100-wide", name: "DP-100", nameKo: "DP-100 댐핑", category: "Damping", categoryKo: "댐핑", description: "DP-100 damping system for heavy doors", descriptionKo: "DP-100 대형 댐핑 시스템", weightCapacity: "100kg", pageNumber: "34", searchText: "dp-100 dp100 damping 댐핑 소프트클로징 soft close heavy" },

  // 1 Body Series
  { id: "1body-40-60", name: "1 Body-40/60", nameKo: "원바디 40/60", category: "Damping", categoryKo: "댐핑", description: "1 Body 40/60 with 8mm upper roller", descriptionKo: "상부롤러 8mm / 2구 롤러", specifications: "상부롤러 8mm / 2구 롤러", pageNumber: "28", searchText: "1body one body 원바디 40 60 상부롤러 2구 롤러" },
  { id: "1body-90", name: "1 Body-90", nameKo: "원바디 90", category: "Damping", categoryKo: "댐핑", description: "1 Body 90 with 8mm upper roller", descriptionKo: "상부롤러 8mm / 2구 롤러", specifications: "상부롤러 8mm / 2구 롤러", pageNumber: "32", searchText: "1body one body 원바디 90 상부롤러 2구 롤러" },

  // Glass Sliding Door (GSD) Series
  { id: "gsd-60", name: "60kg(GSD)", nameKo: "60kg 유리슬라이딩도어", category: "Glass Sliding Door", categoryKo: "유리슬라이딩도어", description: "60kg capacity glass sliding door hardware", descriptionKo: "60kg 용량 유리슬라이딩도어 하드웨어", weightCapacity: "60kg", pageNumber: "64", searchText: "60kg gsd glass sliding door 유리 슬라이딩도어 유리도어" },
  { id: "gsd-80", name: "80kg(GSD)", nameKo: "80kg 유리슬라이딩도어", category: "Glass Sliding Door", categoryKo: "유리슬라이딩도어", description: "80kg capacity glass sliding door hardware", descriptionKo: "80kg 용량 유리슬라이딩도어 하드웨어", weightCapacity: "80kg", pageNumber: "66", searchText: "80kg gsd glass sliding door 유리 슬라이딩도어 유리도어" },
  { id: "gdp-100", name: "100kg(GDP)", nameKo: "100kg 유리댐핑도어", category: "Glass Damping Door", categoryKo: "유리댐핑도어", description: "100kg capacity glass damping door hardware", descriptionKo: "100kg 용량 유리댐핑도어 하드웨어", weightCapacity: "100kg", pageNumber: "68", searchText: "100kg gdp glass damping door 유리 댐핑 도어" },
  { id: "gsd-150", name: "150kg(GSD)", nameKo: "150kg 유리슬라이딩도어", category: "Glass Sliding Door", categoryKo: "유리슬라이딩도어", description: "150kg capacity glass sliding door hardware", descriptionKo: "150kg 용량 유리슬라이딩도어 하드웨어", weightCapacity: "150kg", pageNumber: "70", searchText: "150kg gsd glass sliding door 유리 슬라이딩도어 유리도어" },

  // Folding Door (FD) Series
  { id: "fd-40", name: "40kg(FD)", nameKo: "40kg 폴딩도어", category: "Folding Door", categoryKo: "폴딩도어", description: "40kg capacity folding door hardware", descriptionKo: "40kg 용량 폴딩도어 하드웨어", weightCapacity: "40kg", pageNumber: "74", searchText: "40kg fd folding door 폴딩도어 접이식 도어" },
  { id: "fd-2", name: "2구 (FD)", nameKo: "2구 폴딩도어", category: "Folding Door", categoryKo: "폴딩도어", description: "2-panel folding door hardware", descriptionKo: "2구 폴딩도어 하드웨어", pageNumber: "72", searchText: "2구 fd folding door 폴딩도어 접이식 도어" },
  { id: "fd-100", name: "100kg(FD)", nameKo: "100kg 폴딩도어", category: "Folding Door", categoryKo: "폴딩도어", description: "100kg capacity folding door hardware", descriptionKo: "100kg 용량 폴딩도어 하드웨어", weightCapacity: "100kg", pageNumber: "76", searchText: "100kg fd folding door 폴딩도어 접이식 도어" },

  // MSD / YL / WSD / SD-360 / Ladders
  { id: "msd-100", name: "100kg(MSD)", nameKo: "100kg 무빙슬라이딩도어", category: "Moving Sliding Door", categoryKo: "무빙슬라이딩도어", description: "100kg capacity moving sliding door hardware", descriptionKo: "100kg 용량 무빙슬라이딩도어 하드웨어", weightCapacity: "100kg", pageNumber: "92", searchText: "100kg msd moving sliding door 무빙 슬라이딩도어" },
  { id: "yl-202", name: "YL-202", nameKo: "YL-202", category: "YL Series", categoryKo: "YL 시리즈", description: "YL-202 sliding door system", descriptionKo: "YL-202 슬라이딩도어 시스템", pageNumber: "78", searchText: "yl-202 yl202 sliding door" },
  { id: "yl-845", name: "YL-845", nameKo: "YL-845", category: "YL Series", categoryKo: "YL 시리즈", description: "YL-845 sliding door system", descriptionKo: "YL-845 슬라이딩도어 시스템", pageNumber: "80", searchText: "yl-845 yl845 sliding door" },
  { id: "wsd-yl960", name: "WSD-YL960", nameKo: "WSD-YL960", category: "WSD Series", categoryKo: "WSD 시리즈", description: "WSD-YL960 wall sliding door system", descriptionKo: "WSD-YL960 벽체 슬라이딩도어 시스템", pageNumber: "86", searchText: "wsd-yl960 wsd yl960 wall sliding door 벽체" },
  { id: "wsd-yl970", name: "WSD-YL970", nameKo: "WSD-YL970", category: "WSD Series", categoryKo: "WSD 시리즈", description: "WSD-YL970 wall sliding door system", descriptionKo: "WSD-YL970 벽체 슬라이딩도어 시스템", pageNumber: "88", searchText: "wsd-yl970 wsd yl970 wall sliding door 벽체" },
  { id: "sd-360", name: "SD-360 (DP)", nameKo: "SD-360 댐핑", category: "Damping", categoryKo: "댐핑", description: "SD-360 damping sliding door system", descriptionKo: "SD-360 댐핑 슬라이딩도어 시스템", pageNumber: "82", searchText: "sd-360 sd360 damping dp 댐핑" },
  { id: "sd-370", name: "SD-370 (DP)", nameKo: "SD-370 댐핑", category: "Damping", categoryKo: "댐핑", description: "SD-370 damping sliding door system", descriptionKo: "SD-370 댐핑 슬라이딩도어 시스템", pageNumber: "84", searchText: "sd-370 sd370 damping dp 댐핑" },
  { id: "ladder-1", name: "이동식사다리", nameKo: "이동식사다리 1", category: "Ladder", categoryKo: "이동식사다리", description: "Mobile ladder system 1", descriptionKo: "이동식사다리 시스템 1", pageNumber: "96", searchText: "ladder 사다리 이동식 mobile" },
  { id: "ladder-2", name: "이동식사다리", nameKo: "이동식사다리 2", category: "Ladder", categoryKo: "이동식사다리", description: "Mobile ladder system 2", descriptionKo: "이동식사다리 시스템 2", pageNumber: "96", searchText: "ladder 사다리 이동식 mobile" },

  // SL Rail Series
  { id: "sl-2831", name: "SL-2831", nameKo: "SL-2831", category: "SL Rail", categoryKo: "SL 레일", description: "SL-2831 rail for 60kg(SD)", descriptionKo: "60kg(SD)용 SL-2831 레일", specifications: "60kg(SD)", searchText: "sl-2831 sl2831 rail 레일 60kg sd" },
  { id: "sl-3332", name: "SL-3332", nameKo: "SL-3332", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for 80kg(SD)", descriptionKo: "80kg(SD)용 SL-3332 레일", specifications: "80kg(SD)", searchText: "sl-3332 sl3332 rail 레일 80kg sd" },
  { id: "sl-3445", name: "SL-3445", nameKo: "SL-3445", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3445 rail for 80kg(SD)", descriptionKo: "80kg(SD)용 SL-3445 레일", specifications: "80kg(SD)", searchText: "sl-3445 sl3445 rail 레일 80kg sd" },
  { id: "sl-3540", name: "SL-3540", nameKo: "SL-3540", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3540 rail for M-80", descriptionKo: "M-80 일반용 SL-3540 레일", specifications: "M-80 일반", searchText: "sl-3540 sl3540 rail 레일 m-80 m80" },
  { id: "sl-4550", name: "SL-4550", nameKo: "SL-4550", category: "SL Rail", categoryKo: "SL 레일", description: "SL-4550 rail for 150kg(SD)", descriptionKo: "150kg(SD)용 SL-4550 레일", specifications: "150kg(SD)", searchText: "sl-4550 sl4550 rail 레일 150kg sd" },
  { id: "sl-4977", name: "SL-4977", nameKo: "SL-4977", category: "SL Rail", categoryKo: "SL 레일", description: "SL-4977 wall rail for 150kg(SD)", descriptionKo: "150kg(SD) 벽체레일형 SL-4977 레일", specifications: "150kg(SD) 벽체레일형", searchText: "sl-4977 sl4977 rail 레일 150kg sd wall 벽체" },
  { id: "sl-4550-2", name: "SL-4550", nameKo: "SL-4550 (250kg)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-4550 rail for 250kg(SD)", descriptionKo: "250kg(SD)용 SL-4550 레일", specifications: "250kg(SD)", searchText: "sl-4550 sl4550 rail 레일 250kg sd" },
  { id: "sl-5544", name: "SL-5544", nameKo: "SL-5544", category: "SL Rail", categoryKo: "SL 레일", description: "SL-5544 rail for 200kg(SD) with iron roller", descriptionKo: "200kg(SD) 철롤러용 SL-5544 레일", specifications: "200kg(SD) 철롤러", searchText: "sl-5544 sl5544 rail 레일 200kg sd 철롤러 iron roller" },
  { id: "sl-3337", name: "SL-3337", nameKo: "SL-3337", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3337 rail for 40, 60kg(DP)", descriptionKo: "40, 60kg(DP)용 SL-3337 레일", specifications: "40, 60kg(DP)", searchText: "sl-3337 sl3337 rail 레일 40kg 60kg dp 댐핑" },
  { id: "sl-3032", name: "SL-3032", nameKo: "SL-3032", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3032 rail for 90kg(DP) wireless", descriptionKo: "90kg(DP) 빌레스용 SL-3032 레일", specifications: "90kg(DP) 빌레스", searchText: "sl-3032 sl3032 rail 레일 90kg dp 빌레스" },
  { id: "sl-3032-2", name: "SL-3032", nameKo: "SL-3032 (130kg)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3032 rail for 130kg(DP) wireless", descriptionKo: "130kg(DP) 빌레스용 SL-3032 레일", specifications: "130kg(DP) 빌레스", searchText: "sl-3032 sl3032 rail 레일 130kg dp 빌레스" },
  { id: "sl-4953", name: "SL-4953", nameKo: "SL-4953", category: "SL Rail", categoryKo: "SL 레일", description: "SL-4953 rail for 60kg(SD) shower booth", descriptionKo: "60kg(SD) 샤워부스용 SL-4953 레일", specifications: "60kg(SD) 샤워부스", searchText: "sl-4953 sl4953 rail 레일 60kg sd 샤워부스 shower booth" },
  { id: "sl-3332-glass80", name: "SL-3332", nameKo: "SL-3332 (유리80kg)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for 80kg(SD) glass", descriptionKo: "80kg(SD) 유리용 SL-3332 레일", specifications: "80kg(SD) 유리", searchText: "sl-3332 sl3332 rail 레일 80kg sd 유리 glass" },
  { id: "sl-4550-glass150", name: "SL-4550", nameKo: "SL-4550 (유리150kg)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-4550 rail for 150kg(SD) glass", descriptionKo: "150kg(SD) 유리용 SL-4550 레일", specifications: "150kg(SD) 유리", searchText: "sl-4550 sl4550 rail 레일 150kg sd 유리 glass" },
  { id: "sl-3332-c80", name: "SL-3332", nameKo: "SL-3332 (C-80)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for C-80 semi-auto belt", descriptionKo: "C-80 반자동, 벨트용 SL-3332 레일", specifications: "C-80 반자동, 벨트", searchText: "sl-3332 sl3332 rail 레일 c-80 c80 반자동 벨트 semi-auto belt" },
  { id: "sl-3540-m80", name: "SL-3540", nameKo: "SL-3540 (M-80 반자동)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3540 rail for M-80 semi-auto belt", descriptionKo: "M-80 반자동, 벨트용 SL-3540 레일", specifications: "M-80 반자동, 벨트", searchText: "sl-3540 sl3540 rail 레일 m-80 m80 반자동 벨트 semi-auto belt" },
  { id: "sl-3337-dp", name: "SL-3337", nameKo: "SL-3337 (DP 반자동)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3337 rail for 40,60kg(DP) semi-auto belt", descriptionKo: "40,60kg(DP) 반자동 벨트용 SL-3337 레일", specifications: "40,60kg(DP) 반자동 벨트", searchText: "sl-3337 sl3337 rail 레일 40kg 60kg dp 반자동 벨트 semi-auto belt" },
  { id: "sl-25", name: "SL-25", nameKo: "SL-25", category: "SL Rail", categoryKo: "SL 레일", description: "SL-25 rail φ25 2T SUS304", descriptionKo: "φ25 2T SUS304 SL-25 레일", specifications: "φ25 2T SUS304", searchText: "sl-25 sl25 rail 레일 φ25 sus304 stainless" },
  { id: "sl-3332-4fd", name: "SL-3332", nameKo: "SL-3332 (4구FD)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for 4-panel folding door", descriptionKo: "4구(FD)용 SL-3332 레일", specifications: "4구(FD)", searchText: "sl-3332 sl3332 rail 레일 4구 fd folding door 폴딩도어" },
  { id: "sl-3332-2fd", name: "SL-3332", nameKo: "SL-3332 (2구FD)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for 2-panel folding door", descriptionKo: "2구(FD)용 SL-3332 레일", specifications: "2구(FD)", searchText: "sl-3332 sl3332 rail 레일 2구 fd folding door 폴딩도어" },
  { id: "sl-5471", name: "SL-5471", nameKo: "SL-5471", category: "SL Rail", categoryKo: "SL 레일", description: "SL-5471 rail for FD100/SD500", descriptionKo: "FD100/SD500용 SL-5471 레일", specifications: "FD100 / SD500", searchText: "sl-5471 sl5471 rail 레일 fd100 sd500" },
  { id: "sl-6437", name: "SL-6437", nameKo: "SL-6437", category: "SL Rail", categoryKo: "SL 레일", description: "SL-6437 rail for cubicle roller(SD)", descriptionKo: "큐비클 롤러(SD)용 SL-6437 레일", specifications: "큐비클 롤러(SD)", searchText: "sl-6437 sl6437 rail 레일 cubicle 큐비클 roller" },
  { id: "sl-3332-cubicle", name: "SL-3332", nameKo: "SL-3332 (큐비클)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3332 rail for cubicle roller", descriptionKo: "큐비클 롤러용 SL-3332 레일", specifications: "큐비클 롤러", searchText: "sl-3332 sl3332 rail 레일 cubicle 큐비클 roller" },
  { id: "sl-1534", name: "SL-1534", nameKo: "SL-1534", category: "SL Rail", categoryKo: "SL 레일", description: "SL-1534 large picture rail", descriptionKo: "액자레일 대 SL-1534 레일", specifications: "액자레일 대", searchText: "sl-1534 sl1534 rail 레일 picture 액자레일 대" },
  { id: "sl-1612", name: "SL-1612", nameKo: "SL-1612", category: "SL Rail", categoryKo: "SL 레일", description: "SL-1612 small picture rail", descriptionKo: "액자레일 소 SL-1612 레일", specifications: "액자레일 소", searchText: "sl-1612 sl1612 rail 레일 picture 액자레일 소" },
  { id: "sl-5848", name: "SL-5848", nameKo: "SL-5848", category: "SL Rail", categoryKo: "SL 레일", description: "SL-5848 rail for 100kg moving wall", descriptionKo: "100kg 무빙월용 SL-5848 레일", specifications: "100kg 무빙월", searchText: "sl-5848 sl5848 rail 레일 100kg moving wall 무빙월" },
  { id: "sl-3540-3", name: "SL-3540", nameKo: "SL-3540 (3연동)", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3540 rail for 3-panel sliding", descriptionKo: "3연동용 SL-3540 레일", specifications: "3연동", searchText: "sl-3540 sl3540 rail 레일 3연동 3-panel" },
  { id: "sl-3338", name: "SL-3338", nameKo: "SL-3338", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3338 rail for 1Body 40, 60", descriptionKo: "원바디 40, 60용 SL-3338 레일", specifications: "원바디 40, 60", searchText: "sl-3338 sl3338 rail 레일 1body 원바디 40 60" },
  { id: "sl-3538", name: "SL-3538", nameKo: "SL-3538", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3538 rail for 1Body 90", descriptionKo: "원바디 90용 SL-3538 레일", specifications: "원바디 90", searchText: "sl-3538 sl3538 rail 레일 1body 원바디 90" },
  { id: "sl-3541", name: "SL-3541", nameKo: "SL-3541", category: "SL Rail", categoryKo: "SL 레일", description: "SL-3541 rail for 100kg(DP)", descriptionKo: "100kg(DP)용 SL-3541 레일", specifications: "100Kg (DP)", searchText: "sl-3541 sl3541 rail 레일 100kg dp 댐핑" },
  { id: "sl-1615", name: "SL-1615", nameKo: "SL-1615", category: "SL Rail", categoryKo: "SL 레일", description: "SL-1615 large bottom rail", descriptionKo: "하부레일 대 SL-1615", specifications: "하부레일 대", searchText: "sl-1615 sl1615 rail 레일 하부레일 bottom 대" },
  { id: "sl-1509", name: "SL-1509", nameKo: "SL-1509", category: "SL Rail", categoryKo: "SL 레일", description: "SL-1509 small bottom rail", descriptionKo: "하부레일 소 SL-1509", specifications: "하부레일 소", searchText: "sl-1509 sl1509 rail 레일 하부레일 bottom 소" },

  // Rail Covers
  { id: "rail-cover-1", name: "원슬라이딩 레일+커버", nameKo: "원슬라이딩 레일+커버", category: "Rail Cover", categoryKo: "레일커버", description: "Single sliding rail with cover", descriptionKo: "원슬라이딩 레일+커버", searchText: "rail cover 레일 커버 원슬라이딩 single sliding" },
  { id: "rail-cover-2", name: "2연동 레일+커버", nameKo: "2연동 레일+커버", category: "Rail Cover", categoryKo: "레일커버", description: "2-panel sliding rail with cover", descriptionKo: "2연동 레일+커버", searchText: "rail cover 레일 커버 2연동 2-panel sliding" },
  { id: "rail-cover-3", name: "벽체 카바형 레일+커버", nameKo: "벽체 카바형 레일+커버", category: "Rail Cover", categoryKo: "레일커버", description: "Wall-type cover rail with cover", descriptionKo: "벽체 카바형 레일+커버", searchText: "rail cover 레일 커버 벽체 wall type 카바형" },

  // Guides
  { id: "sd-01-fe", name: "SD-01(철)", nameKo: "SD-01 철", category: "Guide", categoryKo: "가이드", description: "SD-01 L-type guide (Iron), custom order available", descriptionKo: "L형 가이드", specifications: "L형 가이드", pageNumber: "41", searchText: "sd-01 sd01 guide 가이드 iron 철 l형 custom order 주문제작" },
  { id: "sd-01-al", name: "SD-01(AL)", nameKo: "SD-01 알루미늄", category: "Guide", categoryKo: "가이드", description: "SD-01 L-type guide (Aluminum), custom order available", descriptionKo: "L형 가이드", specifications: "L형 가이드", pageNumber: "41", searchText: "sd-01 sd01 guide 가이드 aluminum 알루미늄 al l형 custom order 주문제작" },
  { id: "sd-02-fe", name: "SD-02(철)", nameKo: "SD-02 철", category: "Guide", categoryKo: "가이드", description: "SD-02 L-type guide (Iron), custom order available", descriptionKo: "L형 가이드", specifications: "L형 가이드", pageNumber: "41", searchText: "sd-02 sd02 guide 가이드 iron 철 l형 custom order 주문제작" },
  { id: "sd-02-al", name: "SD-02(AL)", nameKo: "SD-02 알루미늄", category: "Guide", categoryKo: "가이드", description: "SD-02 L-type guide (Aluminum), custom order available", descriptionKo: "L형 가이드", specifications: "L형 가이드", pageNumber: "41", searchText: "sd-02 sd02 guide 가이드 aluminum 알루미늄 al l형 custom order 주문제작" },

  // Shower Booth / Cubicle / Glass Partition / Continuous / Hinge / Closer / Accessories
  { id: "sd-09", name: "SD-09", nameKo: "SD-09", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-09 shower booth hardware, 8mm glass", descriptionKo: "SD-09 샤워부스 하드웨어, 8mm 유리용", specifications: "8mm", pageNumber: "44", searchText: "sd-09 sd09 shower booth 샤워부스 glass 유리 8mm" },
  { id: "sd-10", name: "SD-10", nameKo: "SD-10", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-10 shower booth hardware, 10mm glass", descriptionKo: "SD-10 샤워부스 하드웨어, 10mm 유리용", specifications: "10mm", pageNumber: "44", searchText: "sd-10 sd10 shower booth 샤워부스 glass 유리 10mm" },
  { id: "sd-11", name: "SD-11", nameKo: "SD-11", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-11 shower booth hardware, 12mm glass", descriptionKo: "SD-11 샤워부스 하드웨어, 12mm 유리용", specifications: "12mm", pageNumber: "44", searchText: "sd-11 sd11 shower booth 샤워부스 glass 유리 12mm" },
  { id: "sd-12", name: "SD-12", nameKo: "SD-12", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-12 shower booth hardware", descriptionKo: "SD-12 샤워부스 하드웨어", pageNumber: "44", searchText: "sd-12 sd12 shower booth 샤워부스 glass 유리" },
  { id: "sd-13", name: "SD-13", nameKo: "SD-13", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-13 shower booth hardware, 115mm φ15", descriptionKo: "SD-13 샤워부스 하드웨어, 115mm φ15", specifications: "115mm φ15", pageNumber: "75", searchText: "sd-13 sd13 shower booth 샤워부스 115mm φ15" },
  { id: "sd-14", name: "SD-14", nameKo: "SD-14", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-14 shower booth hardware, 115mm φ15", descriptionKo: "SD-14 샤워부스 하드웨어, 115mm φ15", specifications: "115mm φ15", pageNumber: "75", searchText: "sd-14 sd14 shower booth 샤워부스 115mm φ15" },
  { id: "sd-15", name: "SD-15", nameKo: "SD-15", category: "Shower Booth", categoryKo: "샤워부스", description: "SD-15 shower booth hardware, 150mm φ12", descriptionKo: "SD-15 샤워부스 하드웨어, 150mm φ12", specifications: "150mm φ12", pageNumber: "75", searchText: "sd-15 sd15 shower booth 샤워부스 150mm φ12" },
  { id: "sl-531", name: "SL-531", nameKo: "SL-531", category: "Shower Booth", categoryKo: "샤워부스", description: "SL-531 shower booth rail", descriptionKo: "SL-531 샤워부스 레일", pageNumber: "163", searchText: "sl-531 sl531 shower booth 샤워부스 rail 레일" },
  { id: "cd-101", name: "CD-101", nameKo: "CD-101", category: "Cubicle", categoryKo: "큐비클", description: "CD-101 cubicle door hardware", descriptionKo: "CD-101 큐비클 도어 하드웨어", pageNumber: "145", searchText: "cd-101 cd101 cubicle 큐비클 door 도어 partition 파티션" },
  { id: "cd-102", name: "CD-102", nameKo: "CD-102", category: "Cubicle", categoryKo: "큐비클", description: "CD-102 cubicle door hardware", descriptionKo: "CD-102 큐비클 도어 하드웨어", pageNumber: "145", searchText: "cd-102 cd102 cubicle 큐비클 door 도어 partition 파티션" },
  { id: "cd-310", name: "CD-310", nameKo: "CD-310", category: "Cubicle", categoryKo: "큐비클", description: "CD-310 hydraulic hinge 45kg", descriptionKo: "CD-310 유압힌지 45kg", specifications: "유압힌지 45kg", pageNumber: "148", searchText: "cd-310 cd310 hydraulic hinge 유압힌지 45kg cubicle 큐비클" },
  { id: "cd-320", name: "CD-320", nameKo: "CD-320", category: "Cubicle", categoryKo: "큐비클", description: "CD-320 hydraulic hinge 45kg", descriptionKo: "CD-320 유압힌지 45kg", specifications: "유압힌지 45kg", pageNumber: "149", searchText: "cd-320 cd320 hydraulic hinge 유압힌지 45kg cubicle 큐비클" },
  { id: "cd-905-adj", name: "CD-905 (각도조절)", nameKo: "CD-905 각도조절형", category: "Cubicle", categoryKo: "큐비클", description: "CD-905 angle adjustable cubicle door hardware", descriptionKo: "CD-905 각도조절형 큐비클 도어 하드웨어", pageNumber: "147", searchText: "cd-905 cd905 angle adjustable 각도조절 cubicle 큐비클 door 도어" },
  { id: "cp-510", name: "CP-510", nameKo: "CP-510", category: "Continuous", categoryKo: "컨틴뉴우스", description: "CP-510 continuous pull handle", descriptionKo: "CP-510 컨틴뉴우스 핸들", pageNumber: "158", searchText: "cp-510 cp510 continuous 컨틴뉴우스 handle 핸들 pull" },
  { id: "ct-110", name: "CT-110", nameKo: "CT-110", category: "Door Closer", categoryKo: "도어클로저", description: "CT-110 door closer", descriptionKo: "CT-110 도어 클로저", pageNumber: "197", searchText: "ct-110 ct110 door closer 도어 클로저" },
  { id: "ch-110", name: "CH-110", nameKo: "CH-110", category: "Hinge", categoryKo: "경첩", description: "CH-110 hinge", descriptionKo: "CH-110 경첩", pageNumber: "196", searchText: "ch-110 ch110 hinge 경첩 힌지" },
];

export const defaultProducts: CmsProduct[] = rawProducts.map((p) => ({
  id: p.id,
  name: p.name,
  nameKo: p.nameKo,
  category: p.category,
  categoryKo: p.categoryKo,
  description: p.description ?? null,
  descriptionKo: p.descriptionKo ?? null,
  specifications: p.specifications ?? null,
  weightCapacity: p.weightCapacity ?? null,
  pageNumber: p.pageNumber ?? null,
  imageUrl: p.imageUrl ?? partImageByProductId[p.id] ?? null,
  detailImages: p.detailImages ?? [],
  searchText: p.searchText ?? `${p.name} ${p.nameKo} ${p.category} ${p.categoryKo}`,
}));
