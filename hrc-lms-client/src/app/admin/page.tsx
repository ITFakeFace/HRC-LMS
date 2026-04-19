"use client";
import React, { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
// Import file api của bạn ở đây

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import api from "@/src/api/api";

// Interface dựa trên response JSON thực tế
interface Appointment {
  id: number;
  fullname: string | null;
  phone: string | null;
  email: string | null;
  method: string;
  time: string;
  destination: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const AppointmentCalendar: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [loading, setLoading] = useState(true);
  const toast = React.useRef<Toast>(null);

  // Hàm gọi API lấy danh sách
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/consultation-bookings");

      // Axios trả về response, dữ liệu nằm trong response.data
      // Cấu trúc server trả về: { status: true, data: [...] }
      if (response.data && response.data.status) {
        setAppointments(response.data.data);
      } else {
        console.error("API Error format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải dữ liệu lịch hẹn",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API khi component mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Xử lý cập nhật trạng thái (VD: Xác nhận hoặc Hủy)
  const handleUpdateStatus = async (
    id: number,
    newStatus: "CONFIRMED" | "CANCELLED"
  ) => {
    try {
      // Giả sử API update là PUT /consultation-bookings/:id
      // Bạn cần điều chỉnh body gửi đi tùy theo backend yêu cầu
      await api.put(`/consultation-bookings/${id}`, {
        status: newStatus,
      });

      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: `Đã cập nhật trạng thái thành ${getStatusLabel(newStatus)}`,
        life: 3000,
      });

      // Refresh lại dữ liệu và đóng chi tiết
      fetchAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.current?.show({
        severity: "error",
        summary: "Thất bại",
        detail: "Có lỗi xảy ra khi cập nhật",
        life: 3000,
      });
    }
  };

  // Helper xử lý hiển thị giá trị null hoặc string "null"
  const renderValue = (val: string | null | undefined) => {
    if (!val || val === "null") return "Chưa có";
    return val;
  };

  // Map dữ liệu vào Event của FullCalendar
  const calendarEvents = appointments.map((apt) => {
    // Logic: Nếu fullname null hoặc là chuỗi "null" -> Dùng ID, ngược lại dùng tên thật
    const displayTitle =
      !apt.fullname || apt.fullname === "null" ? `KH #${apt.id}` : apt.fullname;

    return {
      id: apt.id.toString(),
      title: displayTitle, // Bây giờ biến này chắc chắn là string, không còn null
      start: apt.time,
      backgroundColor: getStatusColor(apt.status),
      borderColor: getStatusColor(apt.status),
      extendedProps: apt,
    };
  });

  const viewOptions = [
    { label: "Tháng", value: "dayGridMonth" },
    { label: "Tuần", value: "timeGridWeek" },
    { label: "Ngày", value: "timeGridDay" },
  ];

  function getStatusColor(status: string): string {
    switch (status) {
      case "PENDING":
        return "#f59e0b"; // Amber/Orange
      case "CONFIRMED":
        return "#10b981"; // Emerald/Green
      case "CANCELLED":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "PENDING":
        return "Chờ xác nhận";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  }

  function getStatusSeverity(
    status: string
  ): "warning" | "success" | "danger" | "info" {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "success";
      case "CANCELLED":
        return "danger";
      default:
        return "info";
    }
  }

  const handleEventClick = (clickInfo: any) => {
    setSelectedAppointment(clickInfo.event.extendedProps);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "...";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toast ref={toast} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quản Lý Lịch Đặt Hẹn
            </h1>
            <p className="text-gray-600">Xem và quản lý các cuộc hẹn tư vấn</p>
          </div>
          <Button
            icon="pi pi-refresh"
            rounded
            text
            aria-label="Refresh"
            onClick={fetchAppointments}
            loading={loading}
          />
        </div>

        {loading && appointments.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <ProgressSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Lịch</h2>
                  <Dropdown
                    value={calendarView}
                    options={viewOptions}
                    onChange={(e) => setCalendarView(e.value)}
                    placeholder="Chọn chế độ xem"
                    className="w-40"
                  />
                </div>

                <div className="calendar-container">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "",
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    locale={viLocale}
                    height="auto"
                    eventDisplay="block"
                    displayEventTime={true}
                    eventTimeFormat={{
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }}
                  />
                </div>
              </Card>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg sticky top-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Chi Tiết Cuộc Hẹn
                  </h2>
                  {selectedAppointment && (
                    <Button
                      icon="pi pi-times"
                      className="p-button-text p-button-sm p-0 w-8 h-8"
                      onClick={() => setSelectedAppointment(null)}
                    />
                  )}
                </div>

                {selectedAppointment ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {renderValue(selectedAppointment.fullname)}
                        </h3>
                        <Badge
                          value={getStatusLabel(selectedAppointment.status)}
                          severity={getStatusSeverity(
                            selectedAppointment.status
                          )}
                          className="mt-2"
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        #{selectedAppointment.id}
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-start">
                        <i className="pi pi-clock mt-1 mr-3 text-blue-600 w-5"></i>
                        <div>
                          <p className="text-sm text-gray-500">Thời gian</p>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(selectedAppointment.time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <i className="pi pi-phone mt-1 mr-3 text-green-600 w-5"></i>
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium text-gray-900">
                            {renderValue(selectedAppointment.phone)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <i className="pi pi-envelope mt-1 mr-3 text-purple-600 w-5"></i>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900 break-all">
                            {renderValue(selectedAppointment.email)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <i className="pi pi-video mt-1 mr-3 text-red-600 w-5"></i>
                        <div>
                          <p className="text-sm text-gray-500">Phương thức</p>
                          <p className="font-medium text-gray-900">
                            {selectedAppointment.method}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <i className="pi pi-map-marker mt-1 mr-3 text-orange-600 w-5"></i>
                        <div>
                          <p className="text-sm text-gray-500">Địa điểm</p>
                          {selectedAppointment.destination &&
                          selectedAppointment.destination.startsWith("http") ? (
                            <a
                              href={selectedAppointment.destination}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-blue-600 hover:underline break-all"
                            >
                              {selectedAppointment.destination}
                            </a>
                          ) : (
                            <p className="font-medium text-gray-900 break-all">
                              {renderValue(selectedAppointment.destination)}
                            </p>
                          )}
                        </div>
                      </div>

                      {selectedAppointment.adminNotes && (
                        <div className="flex items-start">
                          <i className="pi pi-file-edit mt-1 mr-3 text-yellow-600 w-5"></i>
                          <div>
                            <p className="text-sm text-gray-500">Ghi chú</p>
                            <p className="font-medium text-gray-900">
                              {selectedAppointment.adminNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chỉ hiện nút hành động nếu trạng thái là PENDING */}
                    {selectedAppointment.status === "PENDING" && (
                      <div className="border-t pt-4 flex gap-2">
                        <Button
                          label="Xác nhận"
                          icon="pi pi-check"
                          className="flex-1"
                          severity="success"
                          size="small"
                          onClick={() =>
                            handleUpdateStatus(
                              selectedAppointment.id,
                              "CONFIRMED"
                            )
                          }
                        />
                        <Button
                          label="Hủy"
                          icon="pi pi-times"
                          className="flex-1"
                          severity="danger"
                          size="small"
                          outlined
                          onClick={() =>
                            handleUpdateStatus(
                              selectedAppointment.id,
                              "CANCELLED"
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="pi pi-calendar text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">
                      Chọn một cuộc hẹn trên lịch để xem chi tiết
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc-event {
          cursor: pointer;
          transition: transform 0.2s;
        }
        .fc-event:hover {
          transform: scale(1.02);
        }
        .fc-daygrid-event {
          padding: 4px;
          border-radius: 4px;
        }
        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 600;
        }
        .p-card {
          border-radius: 0.75rem;
        }
        .p-card-body {
          padding: 1.5rem;
        }
        .p-button {
          border-radius: 0.5rem;
        }
        @media (max-width: 1024px) {
          .sticky {
            position: relative;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentCalendar;
