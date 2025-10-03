"use client";
import React, {useState, useEffect, useRef} from 'react';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {InputText} from 'primereact/inputtext';
import {Toast} from 'primereact/toast';
import {ProgressBar} from 'primereact/progressbar';
import {Toolbar} from 'primereact/toolbar';
import {Dialog} from 'primereact/dialog';
import {Badge} from 'primereact/badge';
import {FilterMatchMode} from 'primereact/api';
import {ConfirmDialog, confirmDialog} from 'primereact/confirmdialog';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import APIClient from "@/lib/api";
import {ResponseModel} from "@/models/ResponseModel";
// import axios from 'axios';

// Mock axios for demo purposes - replace with actual axios import
const mockAxios = {
    get: async (url) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data based on Role schema
        return {
            data: {
                success: true,
                data: [
                    {
                        id: 1,
                        fullname: "Administrator",
                        shortname: "ADMIN",
                        userRoles: [
                            {id: 1, userId: 1},
                            {id: 2, userId: 3}
                        ],
                        parentRoles: [],
                        childRoles: [
                            {id: 1, childRoleId: 2}
                        ],
                        rolePermissions: [
                            {id: 1, permissionId: 1},
                            {id: 2, permissionId: 2},
                            {id: 3, permissionId: 3}
                        ]
                    },
                    {
                        id: 2,
                        fullname: "Manager",
                        shortname: "MGR",
                        userRoles: [
                            {id: 3, userId: 2},
                            {id: 4, userId: 4},
                            {id: 5, userId: 5}
                        ],
                        parentRoles: [
                            {id: 1, parentRoleId: 1}
                        ],
                        childRoles: [
                            {id: 2, childRoleId: 3}
                        ],
                        rolePermissions: [
                            {id: 4, permissionId: 2},
                            {id: 5, permissionId: 4}
                        ]
                    },
                    {
                        id: 3,
                        fullname: "Employee",
                        shortname: "EMP",
                        userRoles: [
                            {id: 6, userId: 6},
                            {id: 7, userId: 7},
                            {id: 8, userId: 8},
                            {id: 9, userId: 9}
                        ],
                        parentRoles: [
                            {id: 2, parentRoleId: 2}
                        ],
                        childRoles: [],
                        rolePermissions: [
                            {id: 6, permissionId: 5}
                        ]
                    },
                    {
                        id: 4,
                        fullname: "Guest User",
                        shortname: "GUEST",
                        userRoles: [
                            {id: 10, userId: 10}
                        ],
                        parentRoles: [],
                        childRoles: [],
                        rolePermissions: []
                    },
                    {
                        id: 5,
                        fullname: "Support Agent",
                        shortname: "SUPPORT",
                        userRoles: [
                            {id: 11, userId: 11},
                            {id: 12, userId: 12}
                        ],
                        parentRoles: [],
                        childRoles: [],
                        rolePermissions: [
                            {id: 7, permissionId: 6},
                            {id: 8, permissionId: 7}
                        ]
                    }
                ],
                total: 5,
                page: 1,
                pageSize: 10
            }
        };
    },
    delete: async (url) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {data: {success: true, message: "Role deleted successfully"}};
    }
};

const RoleListPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            global: {value: null, matchMode: FilterMatchMode.CONTAINS},
            fullname: {value: null, matchMode: FilterMatchMode.STARTS_WITH},
            shortname: {value: null, matchMode: FilterMatchMode.STARTS_WITH}
        }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [roleDialog, setRoleDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        loadLazyData();
    }, [lazyParams]);

    const loadLazyData = async () => {
        setLoading(true);

        try {
            // Build query parameters
            // const params = new URLSearchParams({
            //     page: lazyParams.page + 1,
            //     pageSize: lazyParams.rows,
            //     ...(lazyParams.sortField && {sortBy: lazyParams.sortField}),
            //     ...(lazyParams.sortOrder && {sortOrder: lazyParams.sortOrder === 1 ? 'asc' : 'desc'}),
            //     ...(globalFilterValue && {search: globalFilterValue})
            // });

            const response: ResponseModel = await APIClient.get(`/api/protected/roles`);

            if (response.status == true) {
                // vì response.data là một mảng role
                setRoles(response.data);

                // nếu không có total thì lấy theo độ dài mảng
                setTotalRecords(response.data.length);
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: response.message || 'Không thể tải danh sách role',
                    life: 3000
                });
            }
        } catch (error) {
            console.error('Error loading roles:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi tải dữ liệu',
                life: 3000
            });
        } finally {
            console.log("done loading role")
            setLoading(false);
        }
    };

    const onPage = (event) => {
        setLazyParams(prev => ({...prev, ...event}));
    };

    const onSort = (event) => {
        setLazyParams(prev => ({...prev, ...event}));
    };

    const onFilter = (event) => {
        const newLazyParams = {...lazyParams, ...event, first: 0};
        setLazyParams(newLazyParams);
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        let filters = {...lazyParams.filters};
        filters['global'].value = value;

        setLazyParams(prev => ({...prev, filters, first: 0}));
        setGlobalFilterValue(value);
    };

    const refresh = () => {
        loadLazyData();
    };

    const exportCSV = () => {
        dt.current.exportCSV();
    };

    const confirmDeleteSelected = () => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa ${selectedRoles.length} role đã chọn?`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: deleteSelectedRoles,
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const deleteSelectedRoles = async () => {
        try {
            setLoading(true);

            // In real implementation, you might want to batch delete
            await Promise.all(
                selectedRoles.map(role => mockAxios.delete(`/api/protected/roles/${role.id}`))
            );

            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: `Đã xóa ${selectedRoles.length} role`,
                life: 3000
            });

            setSelectedRoles([]);
            refresh();
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi xóa role',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteRole = (role) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn xóa role "${role.fullname}"?`,
            header: 'Xác nhận xóa',
            icon: 'pi pi-info-circle',
            acceptClassName: 'p-button-danger',
            accept: () => deleteRole(role),
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    const deleteRole = async (role) => {
        try {
            setLoading(true);
            await mockAxios.delete(`/api/protected/roles/${role.id}`);

            toast.current.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Đã xóa role thành công',
                life: 3000
            });

            refresh();
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi xóa role',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const viewRole = (role) => {
        setSelectedRole(role);
        setRoleDialog(true);
    };

    const hideDialog = () => {
        setRoleDialog(false);
        setSelectedRole(null);
    };

    // Column templates
    const idBodyTemplate = (rowData) => {
        return <Badge value={rowData.id} severity="info"/>;
    };

    const shortnameBodyTemplate = (rowData) => {
        return (
            <Badge
                value={rowData.shortname}
                severity="secondary"
                style={{fontFamily: 'monospace'}}
            />
        );
    };

    const userCountBodyTemplate = (rowData) => {
        const count = rowData.userRoles?.length || 0;
        return (
            <Badge
                value={count}
                severity={count > 0 ? "success" : "warning"}
            />
        );
    };

    const permissionCountBodyTemplate = (rowData) => {
        const count = rowData.rolePermissions?.length || 0;
        return (
            <Badge
                value={count}
                severity={count > 0 ? "info" : "warning"}
            />
        );
    };

    const hierarchyBodyTemplate = (rowData) => {
        const parentCount = rowData.parentRoles?.length || 0;
        const childCount = rowData.childRoles?.length || 0;

        return (
            <div className="flex gap-2">
                <Badge
                    value={`${parentCount} cha`}
                    severity="secondary"
                    size="small"
                />
                <Badge
                    value={`${childCount} con`}
                    severity="secondary"
                    size="small"
                />
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-info p-button-text"
                    onClick={() => viewRole(rowData)}
                    tooltip="Xem chi tiết"
                    tooltipOptions={{position: 'top'}}
                />
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-success p-button-text"
                    tooltip="Chỉnh sửa"
                    tooltipOptions={{position: 'top'}}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-danger p-button-text"
                    onClick={() => confirmDeleteRole(rowData)}
                    tooltip="Xóa"
                    tooltipOptions={{position: 'top'}}
                />
            </div>
        );
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    label="Thêm mới"
                    icon="pi pi-plus"
                    className="p-button-success"
                />
                <Button
                    label="Xóa đã chọn"
                    icon="pi pi-trash"
                    className="p-button-danger"
                    onClick={confirmDeleteSelected}
                    disabled={!selectedRoles || selectedRoles.length === 0}
                />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button
                    label="Làm mới"
                    icon="pi pi-refresh"
                    className="p-button-outlined"
                    onClick={refresh}
                />
                <Button
                    label="Xuất Excel"
                    icon="pi pi-upload"
                    className="p-button-outlined"
                    onClick={exportCSV}
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Quản lý Role</h4>
            <span className="p-input-icon-left">
        <i className="pi pi-search"/>
        <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Tìm kiếm..."
        />
      </span>
        </div>
    );

    const roleDialogFooter = (
        <React.Fragment>
            <Button
                label="Đóng"
                icon="pi pi-times"
                className="p-button-text"
                onClick={hideDialog}
            />
        </React.Fragment>
    );

    return (
        <div className="p-4">
            <Toast ref={toast}/>
            <ConfirmDialog/>

            <Card className="shadow-lg">
                <Toolbar
                    className="mb-4"
                    left={leftToolbarTemplate}
                    right={rightToolbarTemplate}
                />

                <DataTable
                    ref={dt}
                    value={roles}
                    selection={selectedRoles}
                    onSelectionChange={(e) => setSelectedRoles(e.value)}
                    dataKey="id"
                    paginator
                    rows={lazyParams.rows}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    totalRecords={totalRecords}
                    lazy
                    first={lazyParams.first}
                    onPage={onPage}
                    onSort={onSort}
                    sortField={lazyParams.sortField}
                    sortOrder={lazyParams.sortOrder}
                    onFilter={onFilter}
                    filters={lazyParams.filters}
                    loading={loading}
                    globalFilterFields={['fullname', 'shortname']}
                    header={header}
                    emptyMessage="Không tìm thấy role nào."
                    className="datatable-responsive"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} role"
                >
                    <Column
                        selectionMode="multiple"
                        headerStyle={{width: '3rem'}}
                        exportable={false}
                    />

                    <Column
                        field="id"
                        header="ID"
                        sortable
                        body={idBodyTemplate}
                        style={{minWidth: '8rem'}}
                    />

                    <Column
                        field="fullname"
                        header="Tên đầy đủ"
                        sortable
                        filter
                        filterPlaceholder="Tìm theo tên"
                        style={{minWidth: '12rem'}}
                    />

                    <Column
                        field="shortname"
                        header="Tên rút gọn"
                        sortable
                        filter
                        filterPlaceholder="Tìm theo mã"
                        body={shortnameBodyTemplate}
                        style={{minWidth: '10rem'}}
                    />

                    <Column
                        header="Số người dùng"
                        body={userCountBodyTemplate}
                        style={{minWidth: '8rem'}}
                    />

                    <Column
                        header="Số quyền"
                        body={permissionCountBodyTemplate}
                        style={{minWidth: '8rem'}}
                    />

                    <Column
                        header="Phân cấp"
                        body={hierarchyBodyTemplate}
                        style={{minWidth: '10rem'}}
                    />

                    <Column
                        header="Hành động"
                        body={actionBodyTemplate}
                        exportable={false}
                        style={{minWidth: '12rem'}}
                    />
                </DataTable>
            </Card>

            <Dialog
                visible={roleDialog}
                style={{width: '32rem'}}
                breakpoints={{'960px': '75vw', '641px': '90vw'}}
                header="Chi tiết Role"
                modal
                className="p-fluid"
                footer={roleDialogFooter}
                onHide={hideDialog}
            >
                {selectedRole && (
                    <div>
                        <div className="field mb-3">
                            <label className="font-bold">ID:</label>
                            <p>{selectedRole.id}</p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Tên đầy đủ:</label>
                            <p>{selectedRole.fullname}</p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Tên rút gọn:</label>
                            <p>
                                <Badge value={selectedRole.shortname} severity="secondary"/>
                            </p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Số người dùng:</label>
                            <p>
                                <Badge
                                    value={selectedRole.userRoles?.length || 0}
                                    severity="success"
                                />
                            </p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Số quyền:</label>
                            <p>
                                <Badge
                                    value={selectedRole.rolePermissions?.length || 0}
                                    severity="info"
                                />
                            </p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Role cha:</label>
                            <p>
                                <Badge
                                    value={selectedRole.parentRoles?.length || 0}
                                    severity="secondary"
                                />
                            </p>
                        </div>

                        <div className="field mb-3">
                            <label className="font-bold">Role con:</label>
                            <p>
                                <Badge
                                    value={selectedRole.childRoles?.length || 0}
                                    severity="secondary"
                                />
                            </p>
                        </div>
                    </div>
                )}
            </Dialog>

            {loading && (
                <div className="fixed top-0 left-0 w-full z-50">
                    <ProgressBar mode="indeterminate" style={{height: '3px'}}/>
                </div>
            )}
        </div>
    );
};

export default RoleListPage;