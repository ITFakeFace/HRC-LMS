"use client";
import React, {useState, useEffect, useRef} from 'react';
import {Card} from 'primereact/card';
import {InputText} from 'primereact/inputtext';
import {Button} from 'primereact/button';
import {Dropdown} from 'primereact/dropdown';
import {MultiSelect} from 'primereact/multiselect';
import {Column} from 'primereact/column';
import {Tag} from 'primereact/tag';
import {Toast} from 'primereact/toast';
import {ConfirmDialog} from 'primereact/confirmdialog';
import {Divider} from 'primereact/divider';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {DataTable} from "primereact/datatable";
import {ProgressSpinner} from 'primereact/progressspinner';
import APIClient from '@/lib/api';
import {ResponseModel} from "@/models/ResponseModel";
import {PermissionDto} from "@/dtos/permission/PermissionDto";
import {RoleDto} from "@/dtos/role/RoleDto"; // Điều chỉnh đường dẫn đến file APIClient của bạn


export default function RoleForm() {
    const toastRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [animateIn, setAnimateIn] = useState(false);

    const [formData, setFormData] = useState({
        fullname: '',
        shortname: '',
        parentRoles: [] as number[],
    });

    const [selectedPermissions, setSelectedPermissions] = useState<PermissionDto[]>([]);

    const [availableRoles, setAvailableRoles] = useState<RoleDto[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<PermissionDto[]>([]);


    // ------------------------------------------------------------------
    // ✅ LOGIC FETCH DATA DÙNG APIClient.get
    // ------------------------------------------------------------------
    useEffect(() => {
        setAnimateIn(true);

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Roles
                // Giả định APIClient.get<T> trả về ResponseModel<T>
                const rolesRes = await APIClient.get<RoleDto[]>('/api/protected/roles');
                // Trích xuất mảng dữ liệu từ phản hồi
                if (rolesRes && rolesRes.status && Array.isArray(rolesRes.data)) {
                    setAvailableRoles(rolesRes.data);
                } else {
                    setAvailableRoles([]);
                    // Thêm thông báo lỗi nếu cần
                }

                // 2. Fetch Permissions
                const permissionsRes = await APIClient.get<PermissionDto[]>('/api/protected/permissions');
                // Trích xuất mảng dữ liệu từ phản hồi
                if (permissionsRes && permissionsRes.status && Array.isArray(permissionsRes.data)) {
                    setAvailablePermissions(permissionsRes.data);
                } else {
                    setAvailablePermissions([]);
                    // Thêm thông báo lỗi nếu cần
                }

            } catch (error: any) {
                // ... (Xử lý lỗi giữ nguyên)
                console.error("Lỗi khi tải dữ liệu:", error);
                const errorMessage = error.response?.data?.message || 'Lỗi kết nối server hoặc không có quyền truy cập.';
                toastRef.current?.show({severity: 'error', summary: 'Lỗi', detail: errorMessage, life: 5000});
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    // ------------------------------------------------------------------

    const handleInputChange = (field, value) => {
        setFormData(prev => ({...prev, [field]: value}));
    };

    const handleAddPermission = (permission: PermissionDto) => {
        if (!selectedPermissions.find(p => p.id === permission.id)) {
            setSelectedPermissions([...selectedPermissions, permission]);
        }
    };

    const handleRemovePermission = (permissionId: number) => {
        setSelectedPermissions(selectedPermissions.filter(p => p.id !== permissionId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullname || !formData.shortname) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Lỗi xác thực',
                detail: 'Vui lòng điền đầy đủ các trường bắt buộc',
                life: 3000
            });
            return;
        }

        const payload = {
            fullname: formData.fullname,
            shortname: formData.shortname,
            parentRoles: formData.parentRoles,
            permissions: selectedPermissions.map(p => p.id)
        };

        console.log('✅ Submitting final payload:', payload);

        // ------------------------------------------------------------------
        // ✅ GỌI API DÙNG APIClient.post
        // ------------------------------------------------------------------
        try {
            console.log(payload);
            // Giả định API trả về RoleDto đã tạo
            const res: ResponseModel = await APIClient.post<RoleDto>('/api/protected/roles', payload);
            if (res.status == true) {
                toastRef.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Tạo role thành công`,
                    life: 3000
                });
            } else {
                const errorMessage = res.message || 'Lỗi kết nối server hoặc xác thực thất bại.';
                toastRef.current?.show({severity: 'error', summary: 'Lỗi', detail: errorMessage, life: 5000});
            }

        } catch (error: any) {
            console.error("Lỗi tạo role:", error);
            // Lấy thông báo lỗi từ body response
            const errorMessage = error.response?.data?.message || 'Lỗi kết nối server hoặc xác thực thất bại.';
            toastRef.current?.show({severity: 'error', summary: 'Lỗi', detail: errorMessage, life: 5000});
        }
        // ------------------------------------------------------------------

        // 5. Reset form
        setFormData({fullname: '', shortname: '', parentRoles: [] as number[]});
        setSelectedPermissions([]);
    };


    const permissionBodyTemplate = (rowData: PermissionDto) => {
        return (
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-semibold text-gray-900">{rowData.name}</div>
                    <div className="text-sm text-gray-500">{rowData.description}</div>
                </div>
                <Button
                    icon="pi pi-times"
                    rounded
                    text
                    severity="danger"
                    onClick={() => handleRemovePermission(rowData.id)}
                    className="transition-all hover:scale-110"
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" animationDuration=".5s"/>
                <p className="ml-4 text-lg text-indigo-600">Đang tải dữ liệu cấu hình...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
            <Toast ref={toastRef}/>
            <ConfirmDialog/>

            <div
                className={`max-w-6xl mx-auto transition-all duration-1000 ${
                    animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Quản lý role
                    </h1>
                    <p className="text-gray-600">Tạo và cấu hình role với quyền và phân cấp</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card
                            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                            title={
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-info-circle text-indigo-600"></i>
                                    <span>Thông tin cơ bản</span>
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="fullname" className="font-semibold text-gray-700">
                                        Tên đầy đủ <span className="text-red-500">*</span>
                                    </label>
                                    <InputText
                                        id="fullname"
                                        value={formData.fullname}
                                        onChange={(e) => handleInputChange('fullname', e.target.value)}
                                        placeholder="vd: Quản trị viên"
                                        className="w-full transition-all focus:scale-[1.02]"
                                        maxLength={50}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label htmlFor="shortname" className="font-semibold text-gray-700">
                                        Tên viết tắt <span className="text-red-500">*</span>
                                    </label>
                                    <InputText
                                        id="shortname"
                                        value={formData.shortname}
                                        onChange={(e) => handleInputChange('shortname', e.target.value.toUpperCase())}
                                        placeholder="vd: ADMIN"
                                        className="w-full transition-all focus:scale-[1.02]"
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card
                            className="shadow-lg hover:shadow-xl transition-shadow duration-300"
                            title={
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-sitemap text-purple-600"></i>
                                    <span>Phân cấp role</span>
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="parentRoles" className="font-semibold text-gray-700">
                                        Kế thừa từ role cha
                                    </label>
                                    <MultiSelect
                                        id="parentRoles"
                                        value={formData.parentRoles}
                                        onChange={(e) => handleInputChange('parentRoles', e.value)}
                                        options={availableRoles}
                                        optionLabel="fullname"
                                        optionValue="id"
                                        placeholder="Chọn role cha"
                                        className="w-full"
                                        display="chip"
                                        filter
                                        disabled={availableRoles.length === 0 && !loading}
                                    />
                                    <small className="text-gray-500">
                                        Vai trò này sẽ kế thừa toàn bộ quyền từ các role cha đã chọn
                                    </small>
                                </div>

                                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                    <div className="flex items-start gap-2">
                                        <i className="pi pi-info-circle text-indigo-600 mt-1"></i>
                                        <div className="text-sm text-gray-700">
                                            <strong>Mẹo phân cấp:</strong> Vai trò cha sẽ tự động cấp quyền của mình cho
                                            role con, tạo thành chuỗi kế thừa.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card
                        className="shadow-lg hover:shadow-xl transition-shadow duration-300 mt-6"
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <i className="pi pi-shield text-indigo-600"></i>
                                    <span>Quản lý quyền</span>
                                </div>
                                <Tag value={`${selectedPermissions.length} đã chọn`} severity="info"/>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label htmlFor="permissionSelect" className="font-semibold text-gray-700">
                                    Thêm quyền
                                </label>
                                <Dropdown
                                    id="permissionSelect"
                                    value={null}
                                    onChange={(e) => handleAddPermission(e.value)}
                                    options={availablePermissions.filter(
                                        p => !selectedPermissions.find(sp => sp.id === p.id)
                                    )}
                                    optionLabel="name"
                                    placeholder="Chọn quyền để thêm"
                                    className="w-full"
                                    filter
                                    showClear
                                    emptyMessage="Tất cả quyền đã được thêm"
                                    disabled={availablePermissions.length === 0 && !loading}
                                    itemTemplate={(option) => (
                                        <div>
                                            <div className="font-semibold">{option.name}</div>
                                            <div className="text-sm text-gray-500">{option.description}</div>
                                        </div>
                                    )}
                                />
                            </div>

                            <Divider/>

                            {selectedPermissions.length > 0 ? (
                                <div className="animate-fadeIn">
                                    <DataTable
                                        value={selectedPermissions}
                                        className="border rounded-lg overflow-hidden"
                                        stripedRows
                                    >
                                        <Column body={permissionBodyTemplate} header="Quyền"/>
                                    </DataTable>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="pi pi-inbox text-5xl mb-3 block"></i>
                                    <p>Chưa có quyền nào được thêm</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button
                            label="Hủy"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            type="button"
                            className="transition-all hover:scale-105"
                            onClick={() => {
                                setFormData({fullname: '', shortname: '', parentRoles: []});
                                setSelectedPermissions([]);
                            }}
                        />
                        <Button
                            label="Tạo role"
                            icon="pi pi-check"
                            severity="success"
                            type="submit"
                            className="transition-all hover:scale-105 bg-gradient-to-r from-indigo-600 to-purple-600"
                            disabled={loading}
                        />
                    </div>
                </form>
            </div>

            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }

                .p-card {
                    border-radius: 12px;
                }

                .p-card-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .p-inputtext:focus,
                .p-dropdown:not(.p-disabled).p-focus,
                .p-multiselect:not(.p-disabled).p-focus {
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                }
            `}</style>
        </div>
    );
}