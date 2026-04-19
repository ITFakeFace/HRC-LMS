"use client";
import React, { useState, useEffect, useRef } from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { classNames } from "primereact/utils";
import api from "@/src/api/api";

// Giả định bạn có instance axios tên là api

// --- INTERFACES ---
interface ConsultationVariant {
  id: string;
  name: string;
  header: string;
  footer: string;
  empty: string;
  course_header: string;
  summary_template?: string;
  intent_map?: Record<string, string>;
  field_dictionary: Record<string, any>;
}

interface BookingVariant {
  id: string;
  name: string;
  ask_fullname: string;
  ask_contact: string;
  ask_email?: string;
  ask_phone?: string;
  ask_time: string;
  ask_method: string;
  ask_destination: string;
  confirmation: string;
}

interface TemplateData {
  consultation: ConsultationVariant[];
  booking: BookingVariant[];
}

const TemplateManager = () => {
  // State
  const [data, setData] = useState<TemplateData>({
    consultation: [],
    booking: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // 0: Consultation, 1: Booking

  // Dialog State
  const [showDialog, setShowDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<
    "consultation" | "booking"
  >("consultation");

  // Form State
  const [formData, setFormData] = useState<any>({});

  // Refs
  const toast = useRef<Toast>(null);

  // --- API ACTIONS ---

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get("/system/templates");
      setData(res.data);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải template",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    try {
      // Validate JSON fields for Consultation
      if (currentCategory === "consultation") {
        try {
          if (typeof formData.field_dictionary === "string") {
            JSON.parse(formData.field_dictionary);
          }
          if (typeof formData.intent_map === "string") {
            JSON.parse(formData.intent_map);
          }
        } catch (e) {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi JSON",
            detail:
              "Field Dictionary hoặc Intent Map không đúng định dạng JSON",
          });
          return;
        }
      }

      // Chuẩn bị payload
      const payload = { ...formData };

      // Parse JSON strings back to objects for API
      if (currentCategory === "consultation") {
        if (typeof payload.field_dictionary === "string")
          payload.field_dictionary = JSON.parse(payload.field_dictionary);
        if (typeof payload.intent_map === "string")
          payload.intent_map = JSON.parse(payload.intent_map);
      }

      if (isEdit) {
        await api.put(
          `/system/templates/${currentCategory}/${payload.id}`,
          payload
        );
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã cập nhật mẫu",
        });
      } else {
        // Xóa ID giả nếu có để server tự gen
        const { id, ...createPayload } = payload;
        await api.post(`/system/templates/${currentCategory}`, createPayload);
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Đã thêm mẫu mới",
        });
      }

      setShowDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error(error);
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Lưu thất bại",
      });
    }
  };

  const handleDelete = (id: string, category: string) => {
    confirmDialog({
      message: "Bạn có chắc muốn xóa mẫu này không?",
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await api.delete(`/system/templates/${category}/${id}`);
          toast.current?.show({
            severity: "success",
            summary: "Đã xóa",
            detail: "Xóa thành công",
          });
          fetchTemplates();
        } catch (error) {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể xóa",
          });
        }
      },
    });
  };

  // --- UI HELPERS ---

  const openNew = () => {
    const category = activeIndex === 0 ? "consultation" : "booking";
    setCurrentCategory(category);
    setIsEdit(false);

    // Init default values
    if (category === "booking") {
      setFormData({
        name: "",
        ask_fullname: "Chào bạn, cho mình xin tên nhé?",
        ask_contact: "Cho mình xin SĐT hoặc Email để liên hệ ạ?",
        ask_time: "Bạn muốn đặt lịch lúc nào?",
        ask_method: "Bạn muốn gặp Online hay Offline?",
        ask_destination: "Địa điểm gặp ở đâu ạ?",
        confirmation:
          "Xác nhận: {fullname} hẹn {method} lúc {time} tại {destination}.",
      });
    } else {
      setFormData({
        name: "",
        header: "",
        footer: "",
        empty: "Không tìm thấy dữ liệu.",
        course_header: "\n📌 {name} ({code})",
        summary_template: "Tìm thấy {count} kết quả.",
        intent_map: "{}",
        field_dictionary: JSON.stringify(
          {
            name: { label: "Tên khóa", is_list: false },
            tuition: { label: "Học phí", is_list: false },
          },
          null,
          2
        ),
      });
    }
    setShowDialog(true);
  };

  const openEdit = (item: any) => {
    const category = activeIndex === 0 ? "consultation" : "booking";
    setCurrentCategory(category);
    setIsEdit(true);

    // Clone item để sửa
    const editItem = { ...item };

    // Stringify các field JSON để hiện trong Textarea
    if (category === "consultation") {
      editItem.field_dictionary = JSON.stringify(
        item.field_dictionary || {},
        null,
        2
      );
      editItem.intent_map = JSON.stringify(item.intent_map || {}, null, 2);
    }

    setFormData(editItem);
    setShowDialog(true);
  };

  const onInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: string
  ) => {
    const val = (e.target && e.target.value) || "";
    setFormData((prev: any) => ({ ...prev, [name]: val }));
  };

  // --- RENDERERS ---

  const renderBookingForm = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-bold">Tên mẫu (Style)</label>
        <InputText
          value={formData.name}
          onChange={(e) => onInputChange(e, "name")}
          placeholder="Ví dụ: Gen Z, Trang trọng..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi tên</label>
          <InputTextarea
            rows={2}
            value={formData.ask_fullname}
            onChange={(e) => onInputChange(e, "ask_fullname")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi liên hệ (Chung)</label>
          <InputTextarea
            rows={2}
            value={formData.ask_contact}
            onChange={(e) => onInputChange(e, "ask_contact")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi thời gian</label>
          <InputTextarea
            rows={2}
            value={formData.ask_time}
            onChange={(e) => onInputChange(e, "ask_time")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi hình thức (Method)</label>
          <InputTextarea
            rows={2}
            value={formData.ask_method}
            onChange={(e) => onInputChange(e, "ask_method")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi địa điểm</label>
          <InputTextarea
            rows={2}
            value={formData.ask_destination}
            onChange={(e) => onInputChange(e, "ask_destination")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi riêng Email (Optional)</label>
          <InputTextarea
            rows={2}
            value={formData.ask_email || ""}
            onChange={(e) => onInputChange(e, "ask_email")}
            placeholder="Để trống nếu không cần"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Hỏi riêng SĐT (Optional)</label>
          <InputTextarea
            rows={2}
            value={formData.ask_phone || ""}
            onChange={(e) => onInputChange(e, "ask_phone")}
            placeholder="Để trống nếu không cần"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 mt-2">
        <label className="font-bold text-blue-600">
          Câu chốt đơn (Confirmation)
        </label>
        <InputTextarea
          rows={3}
          value={formData.confirmation}
          onChange={(e) => onInputChange(e, "confirmation")}
          placeholder="Dùng {fullname}, {time}, {method}, {destination}, {id}"
        />
        <small className="text-gray-500">
          Các biến hỗ trợ: {"{fullname}, {time}, {method}, {destination}, {id}"}
        </small>
      </div>
    </div>
  );

  const renderConsultationForm = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-2">
        <label className="font-bold">Tên mẫu (Style)</label>
        <InputText
          value={formData.name}
          onChange={(e) => onInputChange(e, "name")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-bold">Lời mở đầu (Header)</label>
          <InputTextarea
            rows={3}
            value={formData.header}
            onChange={(e) => onInputChange(e, "header")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold">Lời kết (Footer)</label>
          <InputTextarea
            rows={3}
            value={formData.footer}
            onChange={(e) => onInputChange(e, "footer")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-bold">Template tiêu đề khóa học</label>
        <InputText
          value={formData.course_header}
          onChange={(e) => onInputChange(e, "course_header")}
          placeholder="Ví dụ: 🔷 {name} ({code})"
        />
        <small>
          Dùng {"{name}"} và {"{code}"}
        </small>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-bold">
          Template khi tìm thấy nhiều khóa (`&gt;`5)
        </label>
        <InputText
          value={formData.summary_template || ""}
          onChange={(e) => onInputChange(e, "summary_template")}
          placeholder="Ví dụ: Tìm thấy {count} khóa..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-bold text-orange-600">Intent Map (JSON)</label>
          <InputTextarea
            rows={10}
            className="font-mono text-sm"
            value={formData.intent_map}
            onChange={(e) => onInputChange(e, "intent_map")}
            placeholder='{"tên": "name", ...}'
          />
          <small>Map từ khóa user hỏi sang field trong DB</small>
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-bold text-purple-600">
            Field Dictionary (JSON)
          </label>
          <InputTextarea
            rows={10}
            className="font-mono text-sm"
            value={formData.field_dictionary}
            onChange={(e) => onInputChange(e, "field_dictionary")}
            placeholder='{"name": {"label": "Tên", "is_list": false}, ...}'
          />
          <small>
            Cấu hình cách hiển thị từng field (label, bullet point...)
          </small>
        </div>
      </div>
    </div>
  );

  const renderCardList = (list: any[], category: string) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {list.map((item) => (
        <Card
          key={item.id}
          title={item.name}
          subTitle={`ID: ${item.id}`}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="mb-4 text-gray-600 line-clamp-3">
            {category === "booking" ? item.confirmation : item.header}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              icon="pi pi-pencil"
              severity="info"
              rounded
              text
              onClick={() => openEdit(item)}
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              rounded
              text
              onClick={() => handleDelete(item.id, category)}
            />
          </div>
        </Card>
      ))}
      {list.length === 0 && (
        <div className="col-span-3 text-center py-8 text-gray-500">
          Chưa có mẫu nào.
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Mẫu Câu Trả Lời (AI Chat)
            </h1>
            <p className="text-gray-500">
              Cấu hình cách AI trả lời khi Tư vấn hoặc Đặt lịch
            </p>
          </div>
          <Button
            label="Thêm Mẫu Mới"
            icon="pi pi-plus"
            onClick={openNew}
            raised
          />
        </div>

        <TabView
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
        >
          <TabPanel
            header="Tư Vấn Khóa Học (Consultation)"
            leftIcon="pi pi-book mr-2"
          >
            <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-200 text-blue-800 text-sm">
              <i className="pi pi-info-circle mr-2"></i>
              Tab này cấu hình cách hiển thị thông tin khóa học. Phần{" "}
              <strong>Field Dictionary</strong> quyết định cách format từng
              trường dữ liệu.
            </div>
            {renderCardList(data.consultation, "consultation")}
          </TabPanel>
          <TabPanel
            header="Đặt Lịch Hẹn (Booking)"
            leftIcon="pi pi-calendar mr-2"
          >
            <div className="bg-orange-50 p-4 rounded-md mb-4 border border-orange-200 text-orange-800 text-sm">
              <i className="pi pi-info-circle mr-2"></i>
              Tab này cấu hình các câu hỏi từng bước để AI thu thập thông tin
              đặt lịch của khách hàng.
            </div>
            {renderCardList(data.booking, "booking")}
          </TabPanel>
        </TabView>

        {/* --- DIALOG FORM --- */}
        <Dialog
          header={isEdit ? "Chỉnh sửa Mẫu" : "Tạo Mẫu Mới"}
          visible={showDialog}
          style={{ width: "80vw", maxWidth: "1000px" }}
          onHide={() => setShowDialog(false)}
          footer={
            <div>
              <Button
                label="Hủy"
                icon="pi pi-times"
                onClick={() => setShowDialog(false)}
                className="p-button-text"
              />
              <Button
                label="Lưu Thay Đổi"
                icon="pi pi-check"
                onClick={handleSave}
                autoFocus
              />
            </div>
          }
        >
          <div className="pt-2">
            {currentCategory === "booking"
              ? renderBookingForm()
              : renderConsultationForm()}
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default TemplateManager;
