import { trackEvent } from "@/lib/analytics";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

const BASE_URL = "https://e-coas.replit.app";

export default function Contact() {
  return (
    <Layout>
      <Helmet>
        <title>문의하기 | E-COAS</title>
        <meta name="description" content="E-COAS에 제품 문의, 견적 요청, 카탈로그 신청 등을 남겨주세요. 전문 상담팀이 빠르게 답변 드립니다." />
        <meta property="og:title" content="문의하기 | E-COAS" />
        <meta property="og:description" content="E-COAS에 제품 문의, 견적 요청, 카탈로그 신청 등을 남겨주세요. 전문 상담팀이 빠르게 답변 드립니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/contact`} />
      </Helmet>
      <div className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto">
            Have a question about our products or need a custom quote? Our team is here to help.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-none">
              <CardContent className="p-8 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Phone</h3>
                  <p className="text-muted-foreground mb-2">Mon-Fri from 8am to 6pm</p>
                  <a href="tel:+82212345678" onClick={() => trackEvent("contact_clicked", { method: "phone", location: "contact_page" })} className="text-primary font-semibold hover:underline">+82 2-1234-5678</a>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardContent className="p-8 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email</h3>
                  <p className="text-muted-foreground mb-2">Our friendly team is here to help.</p>
                  <a href="mailto:contact@e-coas.com" onClick={() => trackEvent("contact_clicked", { method: "email", location: "contact_page" })} className="text-primary font-semibold hover:underline">contact@e-coas.com</a>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none">
              <CardContent className="p-8 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Office</h3>
                  <p className="text-muted-foreground">
                    123 Industrial Ave,<br />
                    Design District, Seoul,<br />
                    South Korea
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-none h-full">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                    <Input id="subject" placeholder="Product Inquiry" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                    <Textarea id="message" placeholder="How can we help you?" className="min-h-[150px]" />
                  </div>

                  <Button type="submit" size="lg" className="w-full md:w-auto">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
