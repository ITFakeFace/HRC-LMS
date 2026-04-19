"use client";
import React, { useState, useRef, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Permission } from "@/src/features/permissions/interfaces/Permission.interface";

// Định nghĩa Interface cho Response trả về từ NestJS
interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: any[];
}

// Cấu hình đường dẫn API (Thay đổi port nếu cần)
const API_URL = "http://localhost:3000/permissions";

const PermissionsListPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [visible, setVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<Permission>({
    id: 0,
    name: "",
    description: "",
  });

  const toast = useRef<Toast>(null);

  // Hàm load dữ liệu từ API
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const resData: ApiResponse<Permission[]> = await response.json();

      if (resData.status) {
        setPermissions(resData.data);
      } else {
        showError(resData.message);
      }
    } catch (error) {
      showError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const openNew = () => {
    setCurrentPermission({ id: 0, name: "", description: "" });
    setIsEdit(false);
    setVisible(true);
  };

  const openEdit = (permission: Permission) => {
    setCurrentPermission({ ...permission });
    setIsEdit(true);
    setVisible(true);
  };

  const hideDialog = () => {
    setVisible(false);
    setCurrentPermission({ id: 0, name: "", description: "" });
  };

  // Helper hiển thị thông báo
  const showSuccess = (msg: string) => {
    toast.current?.show({
      severity: "success",
      summary: "Thành công",
      detail: msg,
      life: 3000,
    });
  };

  const showError = (msg: string) => {
    toast.current?.show({
      severity: "error",
      summary: "Lỗi",
      detail: msg,
      life: 3000,
    });
  };

  const savePermission = async () => {
    // Validate client-side cơ bản
    if (
      !currentPermission.name.trim() ||
      !currentPermission.description.trim()
    ) {
      toast.current?.show({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Vui lòng điền đầy đủ thông tin",
        life: 3000,
      });
      return;
    }

    try {
      let response;
      let url;
      let method;

      if (isEdit) {
        // Update Logic (PUT)
        url = `${API_URL}/${currentPermission.id}`;
        method = "PUT";
      } else {
        // Create Logic (POST)
        url = API_URL;
        method = "POST";
      }

      // Loại bỏ ID khi gửi body (nếu create) hoặc chỉ gửi name/desc
      const payload = {
        name: currentPermission.name,
        description: currentPermission.description,
      };

      response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resData: ApiResponse<Permission> = await response.json();

      if (resData.status) {
        showSuccess(resData.message);
        fetchPermissions(); // Reload lại bảng dữ liệu
        hideDialog();
      } else {
        // Xử lý lỗi từ backend (ví dụ validation error)
        const errorMsg =
          resData.errors && resData.errors.length > 0
            ? JSON.stringify(resData.errors)
            : resData.message;
        showError(errorMsg);
      }
    } catch (error) {
      showError("Đã xảy ra lỗi khi lưu dữ liệu");
    }
  };

  const confirmDelete = (permission: Permission) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa Permission "${permission.name}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const response = await fetch(`${API_URL}/${permission.id}`, {
            method: "DELETE",
          });
          const resData: ApiResponse<Permission> = await response.json();

          if (resData.status) {
            showSuccess(resData.message);
            fetchPermissions(); // Reload lại bảng
          } else {
            showError(resData.message);
          }
        } catch (error) {
          showError("Không thể xóa bản ghi này");
        }
      },
    });
  };

  const actionBodyTemplate = (rowData: Permission) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="mr-2"
          onClick={() => openEdit(rowData)}
          severity="info"
          tooltip="Chỉnh sửa"
          tooltipOptions={{ position: "top" }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Xóa"
          tooltipOptions={{ position: "top" }}
        />
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
      <Button label="Lưu" icon="pi pi-check" onClick={savePermission} />
    </div>
  );

  return (
    <div className="p-4" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Permissions</h1>
        <Button
          label="Thêm mới"
          icon="pi pi-plus"
          onClick={openNew}
          severity="success"
        />
      </div>

      <DataTable
        value={permissions}
        loading={loading} // Hiển thị loading spinner
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "50rem" }}
        stripedRows
        showGridlines
        emptyMessage="Không tìm thấy dữ liệu"
      >
        <Column field="id" header="ID" sortable style={{ width: "10%" }} />
        <Column field="name" header="Tên" sortable style={{ width: "30%" }} />
        <Column
          field="description"
          header="Mô tả"
          sortable
          style={{ width: "45%" }}
        />
        <Column
          header="Thao tác"
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: "15%" }}
        />
      </DataTable>

      <Dialog
        visible={visible}
        style={{ width: "500px" }}
        header={isEdit ? "Chỉnh sửa Permission" : "Tạo Permission mới"}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={hideDialog}
      >
        <div className="field mb-4">
          <label htmlFor="name" className="font-bold">
            Tên Permission <span className="text-red-500">*</span>
          </label>
          <InputText
            id="name"
            value={currentPermission.name}
            onChange={(e) =>
              setCurrentPermission({
                ...currentPermission,
                name: e.target.value,
              })
            }
            required
            autoFocus
            className="mt-2"
          />
        </div>

        <div className="field">
          <label htmlFor="description" className="font-bold">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <InputTextarea
            id="description"
            value={currentPermission.description}
            onChange={(e) =>
              setCurrentPermission({
                ...currentPermission,
                description: e.target.value,
              })
            }
            required
            rows={3}
            className="mt-2"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default PermissionsListPage;
