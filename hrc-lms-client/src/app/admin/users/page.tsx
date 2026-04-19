"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DataTable,
  DataTableFilterMeta,
  DataTableFilterMetaData,
} from "primereact/datatable";
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { User, UserWithFullAuth } from "@/src/models/users/User.model";
import api from "@/src/api/api";
import { faU, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Role } from "@/src/features/roles/interfaces/Role.interface";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { FilterMatchMode, FilterOperator, FilterService } from "primereact/api";
import { Toast } from "primereact/toast";

FilterService.register("custom_tags", (value: any, filters: any) => {
  // Nếu không chọn filter nào -> Hiển thị hết
  if (!filters || filters.length === 0) return true;
  // Nếu dòng này không có dữ liệu -> Ẩn
  if (!value || value.length === 0) return false;

  // value: Dữ liệu của dòng (Row Data) -> Là mảng Role object [{shortname: 'ADMIN'}, ...]
  // filters: Dữ liệu người dùng chọn từ Dropdown -> Là mảng String ['ADMIN']

  // Vì value là mảng object, ta cần map ra mảng string để so sánh
  const rowRoleNames = value.map((v: any) => v.shortname || v); // Fallback nếu value là string array

  // Logic: Trả về true nếu có ít nhất 1 role trùng khớp (OR logic)
  return rowRoleNames.some((roleName: string) => filters.includes(roleName));
});

export default function UsersListPage() {
  const OP_ROLES = ["SUPER_ADMIN", "ADMIN"];
  const [users, setUsers] = useState<UserWithFullAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fullname: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
    phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lockoutEnd: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: FilterMatchMode.CUSTOM }],
    },
    roles: {
      operator: FilterOperator.AND,
      constraints: [{ value: null, matchMode: "custom_tags" as any }],
    },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    // 2. Gọi cả 2 API khi trang load
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
      setLoading(false);
    };
    initData();
  }, []);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const _filters = { ...filters };
    (_filters["global"] as DataTableFilterMetaData).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Thay thế bằng API endpoint thực tế của bạn
      // const response = await fetch('/api/users');
      // const result: ApiResponse = await response.json();
      const response = await api.get("/users");
      const data = response.data;
      if (data.status) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/roles");
      const data = response.data;
      if (data.status) {
        setRoleOptions(data.data); // Lưu vào state
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleView = (userId: number) => {
    // Sử dụng Next.js router
    window.location.href = `/admin/users/${userId}`;
  };

  const handleUpdate = (userId: number) => {
    // Điều hướng đến trang chỉnh sửa
    window.location.href = `/admin/users/${userId}/edit`;
  };

  const handleDelete = (userId: number, fullname: string) => {
    confirmDialog({
      message: `Bạn có chắc chắn muốn xóa người dùng "${fullname}"?`,
      header: "Xác nhận xóa",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Xóa",
      rejectLabel: "Hủy",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          // Gọi API Delete
          const response = await api.delete(`/users/${userId}`);
          const result = response.data; // Đây là object ResponseModel

          // Kiểm tra logic dựa trên ResponseModel
          if (result.status === true) {
            // THÀNH CÔNG
            // 1. Cập nhật state để loại bỏ user khỏi bảng ngay lập tức
            setUsers((prevUsers) =>
              prevUsers.filter((user) => user.id !== userId)
            );

            // 2. Hiện Toast thành công
            toast.current?.show({
              severity: "success",
              summary: "Thành công",
              detail: result.message || "Đã xóa người dùng thành công",
              life: 3000,
            });
          } else {
            // THẤT BẠI (Logic lỗi từ server trả về, ví dụ: không tìm thấy ID)
            toast.current?.show({
              severity: "error",
              summary: "Lỗi",
              detail: result.message || "Xóa thất bại",
              life: 3000,
            });
          }
        } catch (error: any) {
          // LỖI MẠNG HOẶC SERVER CRASH (500, 401...)
          console.error("Error deleting user:", error);
          const errorMessage =
            error.response?.data?.message || "Đã xảy ra lỗi kết nối";

          toast.current?.show({
            severity: "error",
            summary: "Lỗi hệ thống",
            detail: errorMessage,
            life: 3000,
          });
        }
      },
    });
  };

  const avatarTemplate = (rowData: UserWithFullAuth) => {
    console.log("Row Data Avatar:", rowData);
    if (rowData.avatar) {
      return (
        <Avatar
          image={"http://localhost:3000" + rowData.avatar}
          size="large"
          shape="circle"
          className="border-2 border-gray-200"
        />
      );
    }
    return (
      <Avatar
        icon="fas fa-user"
        size="large"
        shape="circle"
        className="bg-blue-500 text-white"
      />
    );
  };

  const lockoutTemplate = (rowData: UserWithFullAuth) => {
    if (rowData.lockoutEnd) {
      const lockoutDate = new Date(rowData.lockoutEnd);
      const isLocked = lockoutDate > new Date();

      if (isLocked) {
        return <Tag severity="danger" value="Đã khóa" icon="pi pi-lock" />;
      }
    }
    return <Tag severity="success" value="Hoạt động" icon="pi pi-check" />;
  };

  const getRoleSeverity = (
    role: Role
  ): "info" | "secondary" | "success" | "warning" | "danger" | "contrast" => {
    switch (role.shortname) {
      case "SUPER_ADMIN":
        return "danger";
      default:
        return "secondary";
    }
  };

  const rolesTemplate = (rowData: UserWithFullAuth) => {
    return (
      <div className="flex flex-wrap gap-2">
        {rowData.roles.map((role) => (
          <Tag
            key={role.id} // Dùng ID làm key
            value={role.shortname} // Hiển thị shortname (VD: SUPER_ADMIN)
            severity={getRoleSeverity(role)}
            rounded
          />
        ))}
      </div>
    );
  };

  const actionsTemplate = (rowData: UserWithFullAuth) => {
    const isProtected = rowData.roles.some((roleObj) =>
      OP_ROLES.includes(roleObj.shortname)
    );
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          outlined
          severity="info"
          tooltip="Xem chi tiết"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleView(rowData.id!)}
        />
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="warning"
          tooltip="Chỉnh sửa"
          tooltipOptions={{ position: "top" }}
          onClick={() => handleUpdate(rowData.id!)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          tooltip={isProtected ? "Không thể xóa Admin" : "Xóa"}
          disabled={isProtected} // Disable nếu là Admin
          tooltipOptions={{ position: "top" }}
          onClick={() => handleDelete(rowData.id!, rowData.fullname!)}
        />
      </div>
    );
  };

  const phoneTemplate = (rowData: User) => {
    return rowData.phone ? (
      <span>{rowData.phone}</span>
    ) : (
      <span className="text-gray-400 italic">Chưa cập nhật</span>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center">
        <span className="p-input-icon-left w-full md:w-80">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Tìm kiếm tất cả..."
            className="w-full"
          />
        </span>
        <Button
          type="button"
          icon="pi pi-filter-slash"
          label="Xóa filter"
          outlined
          onClick={() => {
            setFilters({
              global: { value: null, matchMode: FilterMatchMode.CONTAINS },
              fullname: { value: null, matchMode: FilterMatchMode.CONTAINS },
              email: { value: null, matchMode: FilterMatchMode.CONTAINS },
              phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
              // Reset về cấu trúc constraints
              lockoutEnd: {
                operator: FilterOperator.OR,
                constraints: [
                  { value: null, matchMode: FilterMatchMode.CUSTOM },
                ],
              },
              roles: {
                operator: FilterOperator.OR,
                constraints: [
                  { value: null, matchMode: FilterMatchMode.CUSTOM },
                ],
              },
            });
            setGlobalFilterValue("");
          }}
        />
      </div>
    );
  };

  const statusFilterTemplate = (
    options: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <Dropdown
        value={options.value}
        options={[
          { label: "Hoạt động", value: "active" },
          { label: "Đã khóa", value: "locked" },
        ]}
        onChange={(e) => options.filterCallback(e.value)}
        placeholder="Chọn trạng thái"
        className="p-column-filter"
        showClear
      />
    );
  };

  const rolesFilterTemplate = (options: ColumnFilterElementTemplateOptions) => {
    return (
      <MultiSelect
        value={options.value}
        options={roleOptions}
        // Khi chọn xong, gọi filterApplyCallback hoặc filterCallback
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="shortname"
        optionValue="shortname"
        placeholder="Chọn vai trò"
        className="p-column-filter"
        maxSelectedLabels={1}
        display="chip"
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              <i className="fas fa-users mr-3 text-blue-600"></i>
              Danh sách người dùng
            </h1>
            <Button
              label="Thêm người dùng"
              icon="pi pi-plus"
              severity="success"
              onClick={() => (window.location.href = "/admin/users/create")}
            />
          </div>

          <DataTable
            value={users}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            stripedRows
            showGridlines
            emptyMessage="Không có người dùng nào"
            className="p-datatable-sm"
            filters={filters}
            globalFilterFields={["fullname", "email", "phone", "pID"]}
            header={renderHeader()}
            filterDisplay="menu"
            dataKey="id"
          >
            <Column field="id" header="ID" sortable style={{ width: "5%" }} />

            <Column
              header="Avatar"
              body={avatarTemplate}
              style={{ width: "8%" }}
            />

            <Column
              field="fullname"
              header="Họ và tên"
              sortable
              filter
              filterPlaceholder="Tìm theo tên"
              style={{ width: "15%" }}
            />

            <Column
              field="email"
              header="Email"
              sortable
              filter
              filterPlaceholder="Tìm theo email"
              style={{ width: "18%" }}
            />

            <Column
              field="phone"
              header="Số điện thoại"
              body={phoneTemplate}
              filter
              filterPlaceholder="Tìm theo SĐT"
              style={{ width: "12%" }}
            />

            <Column
              header="Tình trạng"
              body={lockoutTemplate}
              sortable
              filter
              filterElement={statusFilterTemplate}
              filterField="lockoutEnd"
              showFilterMatchModes={false}
              showAddButton={false}
              filterFunction={(value: any, filter: any) => {
                if (!filter) return true;
                const isLocked = value && new Date(value) > new Date();
                return filter === "locked" ? isLocked : !isLocked;
              }}
              style={{ width: "10%" }}
            />

            <Column
              field="roles"
              header="Vai trò"
              body={rolesTemplate}
              filter
              filterElement={rolesFilterTemplate}
              filterField="roles"
              showFilterMenu={true}
              showFilterMatchModes={false}
              showAddButton={false}
              // 🔥 GỌI TÊN FILTER Ở ĐÂY
              filterMatchMode="custom_tags"
              // Không cần filterFunction nữa
              style={{ width: "15%" }}
            />

            <Column
              header="Thao tác"
              body={actionsTemplate}
              style={{ width: "12%" }}
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
}
