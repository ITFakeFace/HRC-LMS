"use client";
import React, { useState, useRef } from "react";
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

const PermissionsListPage: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: 1, name: "VIEW_USERS", description: "Xem danh sách người dùng" },
    { id: 2, name: "CREATE_USERS", description: "Tạo người dùng mới" },
    {
      id: 3,
      name: "UPDATE_USERS",
      description: "Cập nhật thông tin người dùng",
    },
    { id: 4, name: "DELETE_USERS", description: "Xóa người dùng" },
    { id: 5, name: "VIEW_ROLES", description: "Xem danh sách Roles" },
    { id: 6, name: "UPDATE_PERMISSIONS", description: "Cập nhật Permissions" },
    { id: 7, name: "VIEW_COURSES", description: "Xem danh sách khóa học" },
    { id: 8, name: "CREATE_PERMISSIONS", description: "Tạo Permissions mới" },
    { id: 9, name: "CREATE_ROLES", description: "Tạo Roles mới" },
    { id: 10, name: "CREATE_COURSES", description: "Tạo khóa học mới" },
    { id: 11, name: "DELETE_ROLES", description: "Xóa Roles" },
    { id: 12, name: "UPDATE_COURSES", description: "Cập nhật khóa học" },
    { id: 13, name: "UPDATE_ROLES", description: "Cập nhật Roles" },
    {
      id: 14,
      name: "VIEW_PERMISSIONS",
      description: "Xem danh sách Permissions",
    },
    { id: 15, name: "DELETE_PERMISSIONS", description: "Xóa Permissions" },
    { id: 16, name: "DELETE_COURSES", description: "Xóa khóa học" },
  ]);

  const [visible, setVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<Permission>({
    id: 0,
    name: "",
    description: "",
  });

  const toast = useRef<Toast>(null);

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

  const savePermission = () => {
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

    if (isEdit) {
      setPermissions(
        permissions.map((p) =>
          p.id === currentPermission.id ? currentPermission : p
        )
      );
      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: "Cập nhật Permission thành công",
        life: 3000,
      });
    } else {
      const newId = Math.max(...permissions.map((p) => p.id), 0) + 1;
      setPermissions([...permissions, { ...currentPermission, id: newId }]);
      toast.current?.show({
        severity: "success",
        summary: "Thành công",
        detail: "Tạo Permission mới thành công",
        life: 3000,
      });
    }

    hideDialog();
  };

  const confirmDelete = (permission: Permission) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa Permission "${permission.name}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      accept: () => {
        setPermissions(permissions.filter((p) => p.id !== permission.id));
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Xóa Permission thành công",
          life: 3000,
        });
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
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        tableStyle={{ minWidth: "50rem" }}
        stripedRows
        showGridlines
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
