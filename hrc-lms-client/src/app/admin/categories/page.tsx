"use client";
import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { Toast } from "primereact/toast"; // Import Type Toast
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Category } from "@/src/features/categories/interfaces/Category.interface";
import api from "@/src/api/api";

// 1. Định nghĩa Type cho State của Form (để xử lý id null)

// 2. Định nghĩa Type cho Errors (key là tên field, value là thông báo lỗi)
type FormErrors = {
  name?: string;
  description?: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 3. Sửa Type cho useRef của Toast
  const toast = useRef<Toast>(null);

  // 4. Áp dụng type cho formData
  const [formData, setFormData] = useState<Category>({
    id: null,
    name: "",
    description: "",
  });

  // 5. Áp dụng type cho formErrors
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/categories");
      const result = response.data;

      if (result.status && result.data) {
        setCategories(result.data);
      } else {
        setError("Không thể tải dữ liệu categories");
      }
    } catch (err: any) {
      setError("Lỗi kết nối đến server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    // 6. Sửa type biến errors cục bộ: Không dùng Category mà dùng FormErrors
    const errors: FormErrors = {};

    if (!formData.name || formData.name.trim() === "") {
      errors.name = "Tên category là bắt buộc";
    }

    if (!formData.description || formData.description.trim() === "") {
      errors.description = "Mô tả là bắt buộc";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({ id: null, name: "", description: "" });
    setFormErrors({});
    setVisible(true);
  };

  const handleOpenEdit = (category: Category) => {
    setIsEdit(true);
    setFormData({ ...category }); // Typescript sẽ chấp nhận vì Category (id number) gán vào CategoryFormState (id number | null) là hợp lệ
    setFormErrors({});
    setVisible(true);
  };

  // 1. Hàm xử lý logic Tạo mới (POST)
  const handleCreate = async () => {
    // Gọi API Post
    const response = await api.post("/categories", {
      name: formData.name,
      description: formData.description,
    });
    return response.data; // Trả về data kết quả
  };

  // 2. Hàm xử lý logic Cập nhật (PUT)
  const handleUpdate = async () => {
    // Kiểm tra an toàn cho TypeScript (vì id có thể null trong state gốc)
    if (!formData.id) {
      throw new Error("ID không hợp lệ");
    }

    // Gọi API Put
    const response = await api.put(`/categories/${formData.id}`, {
      name: formData.name,
      description: formData.description,
    });
    return response.data; // Trả về data kết quả
  };

  // 3. Hàm Submit chính (Điều phối)
  const handleSubmit = async () => {
    // Bước 1: Validate
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true); // Bắt đầu loading

      // Bước 2: Gọi hàm xử lý tương ứng
      // Biến result sẽ hứng kết quả trả về từ handleCreate hoặc handleUpdate
      const result = isEdit ? await handleUpdate() : await handleCreate();

      // Bước 3: Xử lý kết quả trả về
      console.log(result);
      console.log(toast);
      if (result.status) {
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: isEdit
            ? "Cập nhật category thành công"
            : "Tạo mới category thành công",
          life: 3000,
        });
        setVisible(false); // Đóng dialog
        fetchCategories(); // Load lại danh sách
      } else {
        // Xử lý lỗi từ Backend trả về (status: false)
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: result.message || "Có lỗi xảy ra",
          life: 3000,
        });
      }
    } catch (err: any) {
      // Bước 4: Xử lý lỗi mạng hoặc lỗi không mong muốn
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: err.message || "Không thể kết nối đến server",
        life: 3000,
      });
    } finally {
      setSubmitting(false); // Tắt loading dù thành công hay thất bại
    }
  };

  const handleDelete = (category: Category) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa category "${category.name}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const response = await api.delete(`/api/categories/${category.id}`);

          const result = response.data;

          if (result.status) {
            toast.current?.show({
              severity: "success",
              summary: "Thành công",
              detail: "Xóa category thành công",
              life: 3000,
            });
            fetchCategories();
          } else {
            toast.current?.show({
              severity: "error",
              summary: "Lỗi",
              detail: result.message || "Không thể xóa category",
              life: 3000,
            });
          }
        } catch (err) {
          toast.current?.show({
            severity: "error",
            summary: "Lỗi",
            detail: "Không thể kết nối đến server",
            life: 3000,
          });
        }
      },
    });
  };

  const idBodyTemplate = (rowData: Category) => {
    return <span className="font-semibold text-gray-700">#{rowData.id}</span>;
  };

  const nameBodyTemplate = (rowData: Category) => {
    return <span className="text-blue-600 font-medium">{rowData.name}</span>;
  };

  const actionBodyTemplate = (rowData: Category) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="p-button-info"
          onClick={() => handleOpenEdit(rowData)}
          tooltip="Chỉnh sửa"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Xóa"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Hủy"
        icon="pi pi-times"
        onClick={() => setVisible(false)}
        className="p-button-text"
        disabled={submitting}
      />
      <Button
        label={isEdit ? "Cập nhật" : "Tạo mới"}
        icon="pi pi-check"
        onClick={handleSubmit}
        loading={submitting}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Toast ref={toast} />

        <div className="text-center">
          <ProgressSpinner />
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Toast ref={toast} />

        <Message severity="error" text={error} className="w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Danh sách Categories
              </h1>
              <p className="text-gray-600">
                Tổng số:{" "}
                <span className="font-semibold">{categories.length}</span>{" "}
                categories
              </p>
            </div>
            <Button
              label="Tạo mới"
              icon="pi pi-plus"
              onClick={handleOpenCreate}
              className="bg-blue-600 hover:bg-blue-700"
            />
          </div>

          <DataTable
            value={categories}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            tableStyle={{ minWidth: "50rem" }}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} mục"
            emptyMessage="Không có dữ liệu"
            className="text-sm"
            stripedRows
          >
            <Column
              field="id"
              header="ID"
              body={idBodyTemplate}
              sortable
              style={{ width: "10%" }}
            />
            <Column
              field="name"
              header="Tên Category"
              body={nameBodyTemplate}
              sortable
              style={{ width: "30%" }}
            />
            <Column
              field="description"
              header="Mô tả"
              sortable
              style={{ width: "45%" }}
            />
            <Column
              header="Thao tác"
              body={actionBodyTemplate}
              style={{ width: "15%" }}
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        header={isEdit ? "Chỉnh sửa Category" : "Tạo mới Category"}
        visible={visible}
        style={{ width: "500px" }}
        onHide={() => setVisible(false)}
        footer={dialogFooter}
        modal
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-semibold">
              Tên Category <span className="text-red-500">*</span>
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={formErrors.name ? "p-invalid" : ""}
              placeholder="Nhập tên category"
            />
            {formErrors.name && (
              <small className="text-red-500">{formErrors.name}</small>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="font-semibold">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <InputTextarea
              id="description"
              value={formData.description!}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={5}
              className={formErrors.description ? "p-invalid" : ""}
              placeholder="Nhập mô tả chi tiết"
            />
            {formErrors.description && (
              <small className="text-red-500">{formErrors.description}</small>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
