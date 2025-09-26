"use client";
import {useEffect, useRef, useState} from "react";
import {FilterMatchMode, FilterOperator} from "primereact/api";
import {Avatar} from "primereact/avatar";
import {Tag} from "primereact/tag";
import {Button} from "primereact/button";
import {InputText} from "primereact/inputtext";
import {Dropdown} from "primereact/dropdown";
import {Calendar} from "primereact/calendar";
import {Toast} from "primereact/toast";
import {DataTable} from "primereact/datatable";
import {Column} from "primereact/column";
import {UserDto} from "@/dtos/user/UserDto";
import APIClient from "@/lib/api";
import {ResponseModel} from "@/models/ResponseModel";

const AccountsListPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState({
        global: {value: null, matchMode: FilterMatchMode.CONTAINS},
        pID: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.STARTS_WITH}]},
        username: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        email: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        fullname: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        phone: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
        gender: {value: null, matchMode: FilterMatchMode.EQUALS},
        isEmailVerified: {value: null, matchMode: FilterMatchMode.EQUALS},
        createdAt: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
        lockoutEnd: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]}
    });

    const toast = useRef<Toast>(null);

    const fetchUsers = async () => {
        try {
            const res: ResponseModel = await APIClient.get("/api/protected/users");
            if (res.status) {
                console.log("Fetch Users Successfully");
                setUsers(res.data);
                return;
            }
            console.log("Fetch Users Failed: ", res.message);
        } catch (error) {
            console.log(error);
        }
    }

    // Sample data - trong thực tế bạn sẽ fetch từ API
    useEffect(() => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            fetchUsers();
            setLoading(false);
        }, 1000);
    }, []);

    const onGlobalFilterChange = (e: any) => {
        const value = e.target.value;
        const _filters = {...filters};
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const clearFilter = () => {
        initFilters();
    };

    const initFilters = () => {
        setFilters({
            global: {value: null, matchMode: FilterMatchMode.CONTAINS},
            pID: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.STARTS_WITH}]},
            username: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
            email: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
            fullname: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
            phone: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}]},
            gender: {value: null, matchMode: FilterMatchMode.EQUALS},
            isEmailVerified: {value: null, matchMode: FilterMatchMode.EQUALS},
            createdAt: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]},
            lockoutEnd: {operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.DATE_IS}]}
        });
        setGlobalFilterValue('');
    };

    // Template functions
    const avatarBodyTemplate = (rowData: UserDto) => {
        return <Avatar label={rowData.fullname.charAt(0)} shape="circle"/>;
    };

    const genderBodyTemplate = (rowData: UserDto) => {
        return rowData.gender ?
            <Tag value="Nam" severity="info"/> :
            <Tag value="Nữ" severity="warning"/>;
    };

    const dobBodyTemplate = (rowData: UserDto) => {
        return rowData.dob;
    };

    const emailVerifiedBodyTemplate = (rowData: UserDto) => {
        return rowData.isEmailVerified ?
            <Tag value="Verified" severity="success" icon="pi pi-check"/> :
            <Tag value="Unverified" severity="danger" icon="pi pi-times"/>;
    };

    const lockoutBodyTemplate = (rowData: UserDto) => {
        if (rowData.lockoutEnd) {
            const isLocked = new Date() < new Date(rowData.lockoutEnd);
            return isLocked ?
                <Tag value="Locked" severity="danger" icon="pi pi-lock"/> :
                <Tag value="Expired" severity="warning" icon="pi pi-unlock"/>;
        }
        return <Tag value="Active" severity="success" icon="pi pi-unlock"/>;
    };

    const dateBodyTemplate = (rowData: any, field: string) => {
        const date = rowData[field];
        return date ? new Date(date).toLocaleDateString('vi-VN') : '';
    };

    const actionBodyTemplate = (rowData: UserDto) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-info"
                    onClick={() => editUser(rowData)}
                    tooltip="Edit"
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger"
                    onClick={() => confirmDeleteUser(rowData)}
                    tooltip="Delete"
                />
            </div>
        );
    };

    const editUser = (user: UserDto) => {
        toast.current?.show({
            severity: 'info',
            summary: 'Edit User',
            detail: `Editing user: ${user.fullname}`,
            life: 3000
        });
    };

    const confirmDeleteUser = (user: UserDto) => {
        toast.current?.show({
            severity: 'warn',
            summary: 'Delete User',
            detail: `Delete user: ${user.fullname}?`,
            life: 3000
        });
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center">
                <h2 className="m-0 text-2xl font-bold">Users Management</h2>
                <div className="flex gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search"/>
                        <InputText
                            value={globalFilterValue}
                            onChange={onGlobalFilterChange}
                            placeholder="Global Search"
                        />
                    </span>
                    <Button
                        type="button"
                        icon="pi pi-filter-slash"
                        label="Clear"
                        className="p-button-outlined"
                        onClick={clearFilter}
                    />
                    <Button
                        icon="pi pi-plus"
                        label="Add User"
                        className="p-button-success"
                        onClick={() => toast.current?.show({
                            severity: 'success',
                            summary: 'Add User',
                            detail: 'Add new user functionality',
                            life: 3000
                        })}
                    />
                </div>
            </div>
        );
    };

    const genderFilterTemplate = (options: any) => {
        return (
            <Dropdown
                value={options.value}
                options={[
                    {label: 'Nam', value: true},
                    {label: 'Nữ', value: false}
                ]}
                onChange={(e) => options.filterCallback(e.value, options.index)}
                placeholder="Select Gender"
                className="p-column-filter"
                showClear
            />
        );
    };

    const verifiedFilterTemplate = (options: any) => {
        return (
            <Dropdown
                value={options.value}
                options={[
                    {label: 'Verified', value: true},
                    {label: 'Unverified', value: false}
                ]}
                onChange={(e) => options.filterCallback(e.value, options.index)}
                placeholder="Select Status"
                className="p-column-filter"
                showClear
            />
        );
    };

    const dateFilterTemplate = (options: any) => {
        return (
            <Calendar
                value={options.value}
                onChange={(e) => options.filterCallback(e.value, options.index)}
                placeholder="Select Date"
                dateFormat="dd/mm/yy"
                className="p-column-filter"
            />
        );
    };

    return (
        <div className="bg-gray-50 p-4">
            <Toast ref={toast}/>

            <div className="bg-white rounded-lg shadow-sm">
                <DataTable
                    value={users}
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    loading={loading}
                    dataKey="id"
                    filters={filters}
                    globalFilterFields={['pID', 'username', 'email', 'fullname', 'phone']}
                    header={renderHeader()}
                    emptyMessage="No users found."
                    className="p-datatable-gridlines"
                >
                    <Column
                        field="avatar"
                        header="Avatar"
                        body={avatarBodyTemplate}
                        style={{minWidth: '80px'}}
                    />

                    <Column
                        field="pID"
                        header="CCCD"
                        filter
                        filterPlaceholder="Search by PID"
                        style={{minWidth: '120px'}}
                    />

                    <Column
                        field="username"
                        header="Tên tài khoản"
                        filter
                        filterPlaceholder="Search by username"
                        style={{minWidth: '150px'}}
                    />

                    <Column
                        field="fullname"
                        header="Họ Tên"
                        filter
                        filterPlaceholder="Search by name"
                        style={{minWidth: '200px'}}
                    />

                    <Column
                        field="email"
                        header="Email"
                        filter
                        filterPlaceholder="Search by email"
                        style={{minWidth: '250px'}}
                    />

                    <Column
                        field="phone"
                        header="SĐT"
                        filter
                        filterPlaceholder="Search by phone"
                        style={{minWidth: '130px'}}
                    />

                    <Column
                        field="gender"
                        header="Giới tính"
                        body={genderBodyTemplate}
                        filter
                        filterElement={genderFilterTemplate}
                        style={{minWidth: '100px'}}
                    />

                    <Column
                        field="dob"
                        header="Ngày sinh"
                        body={(rowData) => dateBodyTemplate(rowData, 'dob')}
                        filter
                        filterElement={dateFilterTemplate}
                        style={{minWidth: '100px'}}
                    />

                    <Column
                        field="isEmailVerified"
                        header="Tình trạng email"
                        body={emailVerifiedBodyTemplate}
                        filter
                        filterElement={verifiedFilterTemplate}
                        style={{minWidth: '130px'}}
                    />

                    <Column
                        field="lockoutEnd"
                        header="Trạng thái"
                        body={lockoutBodyTemplate}
                        style={{minWidth: '130px'}}
                    />

                    <Column
                        field="createdAt"
                        header="Tạo lúc"
                        body={(rowData) => dateBodyTemplate(rowData, 'createdAt')}
                        filter
                        filterElement={dateFilterTemplate}
                        style={{minWidth: '130px'}}
                    />

                    <Column
                        header="Actions"
                        body={actionBodyTemplate}
                        style={{minWidth: '120px'}}
                    />
                </DataTable>
            </div>
        </div>
    );
}

export default AccountsListPage;