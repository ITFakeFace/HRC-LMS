"use client";
import React from "react";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import ChatSupportWidget from "@/src/components/homepage/ChatSupportWidget";
// 👇 Import Chat Widget

export default function Home() {
  const features = [
    {
      icon: "fa-solid fa-chalkboard-user", // Icon Giảng dạy
      title: "Đào tạo Thực chiến",
      description:
        "Giáo trình được xây dựng dựa trên case study thực tế, cam kết ứng dụng ngay vào công việc.",
    },
    {
      icon: "fa-solid fa-user-tie", // Icon Chuyên gia
      title: "Chuyên gia Đầu ngành",
      description:
        "Đội ngũ giảng viên là các CHRO, Giám đốc Nhân sự với hơn 10 năm kinh nghiệm quản trị.",
    },
    {
      icon: "fa-solid fa-sitemap", // Icon Hệ thống/Lộ trình
      title: "Lộ trình Bài bản",
      description:
        "Hệ thống khóa học toàn diện từ C&B, Tuyển dụng, L&D đến HRBP và Quản trị chiến lược.",
    },
    {
      icon: "fa-solid fa-handshake", // Icon Hợp tác
      title: "Đồng hành trọn đời",
      description:
        "Kết nối cộng đồng HR, hỗ trợ giải đáp thắc mắc và tư vấn nghề nghiệp sau khóa học.",
    },
  ];

  const services = [
    {
      title: "Khóa học Public",
      description:
        "Các khóa đào tạo nghiệp vụ chuyên sâu: C&B, Tuyển dụng, Luật lao động, L&D...",
      color: "bg-blue-500",
    },
    {
      title: "Đào tạo In-house",
      description:
        'Thiết kế chương trình đào tạo riêng biệt, "may đo" theo nhu cầu thực tế của doanh nghiệp.',
      color: "bg-purple-500",
    },
    {
      title: "Tư vấn Nhân sự",
      description:
        "Xây dựng hệ thống Lương thưởng (Total Rewards), Khung năng lực và KPI/OKRs.",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* Font Awesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Nâng tầm{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nguồn Nhân Lực
              </span>{" "}
              Việt
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Hệ thống đào tạo và tư vấn quản trị nhân sự hàng đầu, cung cấp
              giải pháp toàn diện cho sự phát triển bền vững của doanh nghiệp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                label="Xem lịch khai giảng"
                icon="pi pi-calendar"
                iconPos="right"
                className="bg-blue-600 border-blue-600 text-lg px-8 py-3 shadow-lg hover:bg-blue-700"
              />
              <Button
                label="Tư vấn khóa học"
                icon="pi pi-comments"
                className="bg-white text-blue-600 border-2 border-blue-600 text-lg px-8 py-3 hover:bg-blue-50"
                outlined
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Tại sao chọn HRC?) --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Giá trị HRC mang lại
            </h2>
            <p className="text-gray-600 text-lg">
              Chất lượng đào tạo tạo nên sự khác biệt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="hover:shadow-xl transition-all duration-300 border-0 h-full bg-gray-50"
              >
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <i className={`${feature.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION (Các khóa học/Dịch vụ) --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Giải pháp Đào tạo
            </h2>
            <p className="text-gray-600 text-lg">
              Đáp ứng mọi nhu cầu từ Cá nhân đến Doanh nghiệp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
              >
                <div className={`${service.color} h-2 w-full`}></div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <a
                    href="#"
                    className="text-blue-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                  >
                    Xem chi tiết <i className="fa-solid fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS SECTION (Số liệu uy tín) --- */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            {[
              {
                number: "10.000+",
                label: "Học viên tốt nghiệp",
                icon: "fa-graduation-cap",
              },
              {
                number: "500+",
                label: "Đối tác doanh nghiệp",
                icon: "fa-building",
              },
              {
                number: "50+",
                label: "Giảng viên chuyên gia",
                icon: "fa-chalkboard-user",
              },
              { number: "98%", label: "Tỷ lệ hài lòng", icon: "fa-star" },
            ].map((stat, idx) => (
              <div key={idx} className="p-6">
                <i
                  className={`fa-solid ${stat.icon} text-4xl mb-4 opacity-80`}
                ></i>
                <div className="text-5xl font-bold mb-2 tracking-tight">
                  {stat.number}
                </div>
                <div className="text-lg opacity-90 font-light uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Sẵn sàng bứt phá sự nghiệp HR?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Đăng ký tư vấn ngay để nhận lộ trình học tập phù hợp nhất với mục
            tiêu của bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              label="Đăng ký tư vấn ngay"
              icon="pi pi-phone"
              className="bg-blue-600 border-blue-600 text-lg px-8 py-3 shadow-lg hover:bg-blue-700"
            />
            <Button
              label="Test năng lực HR Free"
              icon="pi pi-check-circle"
              className="bg-purple-600 border-purple-600 text-lg px-8 py-3 shadow-lg hover:bg-purple-700"
            />
          </div>
        </div>
      </section>

      {/* --- CHAT WIDGET --- */}
      <ChatSupportWidget />
    </div>
  );
}
