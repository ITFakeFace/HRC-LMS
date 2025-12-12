// pages/roles/index.tsx
"use client";
import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { Role } from "@/src/features/roles/interfaces/Role.interface";
import { RoleDetail } from "@/src/features/roles/interfaces/RoleDetail.interface";
import { Permission } from "@/src/features/permissions/interfaces/Permission.interface";
import api from "@/src/api/api";

interface CreateRolePayload {
  fullname: string;
  shortname: string;
  permissions: number[];
  parentRoles: number[];
}

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDetail | null>(null);
  const [displayDialog, setDisplayDialog] = useState(false);
  const [displayDetailDialog, setDisplayDetailDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const toast = useRef<Toast>(null);

  const validationSchema = Yup.object({
    fullname: Yup.string()
      .required("Tên đầy đủ là bắt buộc")
      .min(3, "Tên phải có ít nhất 3 ký tự")
      .max(100, "Tên không được quá 100 ký tự"),
    shortname: Yup.string()
      .required("Tên ngắn là bắt buộc")
      .min(2, "Tên ngắn phải có ít nhất 2 ký tự")
      .max(50, "Tên ngắn không được quá 50 ký tự")
      .matches(
        /^[A-Z_]+$/,
        "Tên ngắn chỉ được chứa chữ in hoa và dấu gạch dưới"
      ),
    permissions: Yup.array()
      .of(Yup.number())
      .min(1, "Phải chọn ít nhất 1 quyền"),
    parentRoles: Yup.array().of(Yup.number()),
  });

  const formik = useFormik({
    initialValues: {
      fullname: "",
      shortname: "",
      permissions: [] as number[],
      parentRoles: [] as number[],
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (isEdit && selectedRole) {
          await updateRole(selectedRole.role.id, values);
        } else {
          await createRole(values);
        }
        await fetchRoles();
        setDisplayDialog(false);
        formik.resetForm();
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: isEdit ? "Cập nhật role thành công" : "Tạo role thành công",
          life: 3000,
        });
      } catch (error) {
        toast.current?.show({
          severity: "error",
          summary: "Lỗi",
          detail: "Có lỗi xảy ra",
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      const data = response.data;
      if (data.status) {
        setRoles(data.data);
        setAllRoles(data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get("/permissions");
      const data = await response.data;
      if (data.status) {
        setAllPermissions(data.data);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const fetchRoleDetail = async (id: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/roles/${id}`);
      const data = await response.data;
      if (data.status) {
        setSelectedRole(data.data);
        setDisplayDetailDialog(true);
      }
    } catch (error) {
      console.error("Error fetching role detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async (payload: CreateRolePayload) => {
    const response = await fetch("/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  const updateRole = async (id: number, payload: CreateRolePayload) => {
    const response = await fetch(`/roles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  };

  const deleteRole = async (id: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/roles/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status) {
        await fetchRoles();
        toast.current?.show({
          severity: "success",
          summary: "Thành công",
          detail: "Xóa role thành công",
          life: 3000,
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể xóa role",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewDialog = () => {
    setIsEdit(false);
    formik.resetForm();
    setDisplayDialog(true);
  };

  const openEditDialog = async (role: Role) => {
    try {
      setLoading(true);
      const response = await api.get(`/roles/${role.id}`);
      const data = await response.data;
      if (data.status) {
        const roleDetail = data.data.role;
        setIsEdit(true);
        setSelectedRole(data.data);
        formik.setValues({
          fullname: roleDetail.fullname,
          shortname: roleDetail.shortname,
          permissions: Array.isArray(roleDetail.permissions)
            ? roleDetail.permissions.map((p: Permission) => p.id)
            : roleDetail.permissions,
          parentRoles: roleDetail.parentRoles || [],
        });
        setDisplayDialog(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (role: Role) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa role "${role.fullname}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName: "p-button-danger",
      accept: () => deleteRole(role.id),
    });
  };

  const userCountTemplate = (rowData: Role) => {
    const userCount = Array.isArray(rowData.users) ? rowData.users.length : 0;
    return <span>{userCount}</span>;
  };

  const parentRolesTemplate = (rowData: Role) => {
    const count = rowData.parentRoles?.length || 0;
    return <span>{count}</span>;
  };

  const childRolesTemplate = (rowData: Role) => {
    const count = rowData.childRoles?.length || 0;
    return <span>{count}</span>;
  };

  const actionsTemplate = (rowData: Role) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          text
          severity="info"
          onClick={() => fetchRoleDetail(rowData.id)}
          tooltip="Xem chi tiết"
        />
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="warning"
          onClick={() => openEditDialog(rowData)}
          tooltip="Chỉnh sửa"
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Xóa"
        />
      </div>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Hủy"
        icon="pi pi-times"
        onClick={() => {
          setDisplayDialog(false);
          formik.resetForm();
        }}
        className="p-button-text"
      />
      <Button
        label={isEdit ? "Cập nhật" : "Tạo mới"}
        icon="pi pi-check"
        onClick={() => formik.handleSubmit()}
        loading={loading}
        autoFocus
      />
    </div>
  );

  const detailDialogFooter = (
    <Button
      label="Đóng"
      icon="pi pi-times"
      onClick={() => setDisplayDetailDialog(false)}
    />
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <div className="flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Roles</h2>
          <Button
            label="Tạo Role mới"
            icon="pi pi-plus"
            onClick={openNewDialog}
          />
        </div>

        <DataTable
          value={roles}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          tableStyle={{ minWidth: "60rem" }}
          emptyMessage="Không có dữ liệu"
        >
          <Column field="id" header="ID" sortable style={{ width: "5%" }} />
          <Column
            field="fullname"
            header="Tên đầy đủ"
            sortable
            style={{ width: "20%" }}
          />
          <Column
            field="shortname"
            header="Tên ngắn"
            sortable
            style={{ width: "15%" }}
          />
          <Column
            body={userCountTemplate}
            header="Số User"
            sortable
            style={{ width: "10%" }}
          />
          <Column
            body={parentRolesTemplate}
            header="Quyền cha"
            style={{ width: "10%" }}
          />
          <Column
            body={childRolesTemplate}
            header="Quyền con"
            style={{ width: "10%" }}
          />
          <Column
            body={actionsTemplate}
            header="Thao tác"
            style={{ width: "15%" }}
          />
        </DataTable>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        header={isEdit ? "Chỉnh sửa Role" : "Tạo Role mới"}
        visible={displayDialog}
        style={{ width: "600px" }}
        onHide={() => {
          setDisplayDialog(false);
          formik.resetForm();
        }}
        footer={dialogFooter}
      >
        <form onSubmit={formik.handleSubmit} className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="fullname" className="font-bold">
              Tên đầy đủ <span className="text-red-500">*</span>
            </label>
            <InputText
              id="fullname"
              name="fullname"
              value={formik.values.fullname}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.fullname && formik.errors.fullname
                  ? "p-invalid"
                  : ""
              }
            />
            {formik.touched.fullname && formik.errors.fullname && (
              <small className="p-error">{formik.errors.fullname}</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="shortname" className="font-bold">
              Tên ngắn <span className="text-red-500">*</span>
            </label>
            <InputText
              id="shortname"
              name="shortname"
              value={formik.values.shortname}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.shortname && formik.errors.shortname
                  ? "p-invalid"
                  : ""
              }
            />
            {formik.touched.shortname && formik.errors.shortname && (
              <small className="p-error">{formik.errors.shortname}</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="permissions" className="font-bold">
              Quyền <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              id="permissions"
              name="permissions"
              value={formik.values.permissions}
              options={allPermissions}
              onChange={(e) => formik.setFieldValue("permissions", e.value)}
              optionLabel="name"
              optionValue="id"
              placeholder="Chọn quyền"
              maxSelectedLabels={3}
              className={
                formik.touched.permissions && formik.errors.permissions
                  ? "p-invalid"
                  : ""
              }
              filter
            />
            {formik.touched.permissions && formik.errors.permissions && (
              <small className="p-error">{formik.errors.permissions}</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="parentRoles" className="font-bold">
              Role cha
            </label>
            <MultiSelect
              id="parentRoles"
              name="parentRoles"
              value={formik.values.parentRoles}
              options={allRoles.filter(
                (r) => !isEdit || r.id !== selectedRole?.role.id
              )}
              onChange={(e) => formik.setFieldValue("parentRoles", e.value)}
              optionLabel="fullname"
              optionValue="id"
              placeholder="Chọn role cha"
              maxSelectedLabels={3}
              filter
            />
          </div>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        header="Chi tiết Role"
        visible={displayDetailDialog}
        style={{ width: "800px" }}
        onHide={() => setDisplayDetailDialog(false)}
        footer={detailDialogFooter}
      >
        {selectedRole && (
          <div>
            <div className="mb-3">
              <strong>ID:</strong> {selectedRole.role.id}
            </div>
            <div className="mb-3">
              <strong>Tên đầy đủ:</strong> {selectedRole.role.fullname}
            </div>
            <div className="mb-3">
              <strong>Tên ngắn:</strong> {selectedRole.role.shortname}
            </div>

            <div className="mb-3">
              <strong>Người dùng ({selectedRole.role.users.length}):</strong>
              {selectedRole.role.users.length > 0 ? (
                <ul className="mt-2">
                  {selectedRole.role.users.map((user) => (
                    <li key={user.id}>
                      {user.fullname} ({user.username})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">Không có người dùng</p>
              )}
            </div>

            <div className="mb-3">
              <strong>Quyền ({selectedRole.role.permissions.length}):</strong>
              {selectedRole.role.permissions.length > 0 ? (
                <ul className="mt-2">
                  {selectedRole.role.permissions.map((perm) => (
                    <li key={perm.id}>
                      <strong>{perm.name}:</strong> {perm.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">Không có quyền</p>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default RolesPage;
