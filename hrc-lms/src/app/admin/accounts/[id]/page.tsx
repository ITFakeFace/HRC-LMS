"use client";
import React, {useState, useEffect} from 'react';
import {Card} from 'primereact/card';
import {Avatar} from 'primereact/avatar';
import {Badge} from 'primereact/badge';
import {Chip} from 'primereact/chip';
import {Panel} from 'primereact/panel';
import {Divider} from 'primereact/divider';
import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import {Button} from 'primereact/button';
import {Tag} from 'primereact/tag';
import {Skeleton} from 'primereact/skeleton';
import {Mail, Phone, Calendar, MapPin, Award, Clock, TrendingUp, Activity} from 'lucide-react';
import APIClient from "@/lib/api";
import {useParams} from "next/navigation";
import {ResponseModel} from "@/models/ResponseModel";

export default function UserDetails() {
    const params = useParams(); // { id: '123' }
    const userId = params?.id;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchUser = async () => {
            try {
                const res: ResponseModel = await APIClient.get(`/api/protected/users/${userId}`);

                if (res.status == true) {
                    setUser(res.data);
                } else {
                    console.error("API trả về lỗi:", res.message);
                }
            } catch (err) {
                console.error("Lỗi khi fetch user:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [userId]);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const InfoItem = ({icon: Icon, label, value, color = "text-indigo-600"}) => (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className={`${color} mt-1`}>
                <Icon size={20}/>
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <Skeleton width="100%" height="200px" className="mb-4"/>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton width="100%" height="400px"/>
                        <div className="lg:col-span-2">
                            <Skeleton width="100%" height="400px"/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusTemplate = (rowData) => {
        const severity = rowData.status === 'active' ? 'success' : 'info';
        return <Tag value={rowData.status?.toUpperCase() || 'ACTIVE'} severity={severity}/>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.4s ease-out;
        }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        .stat-card {
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #4F46E5, #7C3AED);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.6s ease;
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .profile-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .profile-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 15s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10%, -10%) scale(1.1); }
        }

        .data-table-wrapper {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>

            {/* Header Banner */}
            <div className="profile-header text-white py-12 px-6 animate-slideDown">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <Avatar
                                label={user.fullname.charAt(0)}
                                size="xlarge"
                                shape="circle"
                                className="bg-white text-indigo-600 text-5xl border-4 border-white/30 shadow-2xl"
                                style={{width: '140px', height: '140px'}}
                                image={user.avatar}
                            />
                            {user.isEmailVerified && (
                                <div
                                    className="absolute bottom-2 right-2 bg-green-500 rounded-full p-2 shadow-lg border-4 border-white">
                                    <i className="pi pi-check text-white text-xs font-bold"></i>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-bold mb-2">{user.fullname}</h1>
                            <p className="text-white/90 text-lg mb-3">@{user.username}</p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                {user.userRoles.map((ur, idx) => (
                                    <Chip
                                        key={idx}
                                        label={ur.role.name}
                                        icon="pi pi-shield"
                                        className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-4 py-2"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                icon="pi pi-pencil"
                                label="Chỉnh sửa"
                                className="p-button-rounded bg-white text-indigo-600 hover:bg-white/90 border-0"
                            />
                            <Button
                                icon="pi pi-cog"
                                className="p-button-rounded p-button-outlined border-white/50 text-white hover:bg-white/10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8 pb-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        user.createdCourses && user.createdCourses.length > 0 && {
                            label: 'Khóa học',
                            value: user.createdCourses.length,
                            icon: Award,
                            color: 'bg-blue-500',
                            trend: '+12%'
                        },
                        user.editedCourses && user.editedCourses.length > 0 && {
                            label: 'Đã chỉnh sửa',
                            value: user.editedCourses.length,
                            icon: Activity,
                            color: 'bg-green-500',
                            trend: '+5%'
                        },
                        user.HRCClass && user.HRCClass.length > 0 && {
                            label: 'Lớp học',
                            value: user.HRCClass.length,
                            icon: TrendingUp,
                            color: 'bg-purple-500',
                            trend: '+8%'
                        },
                        {
                            label: 'Tổng học viên',
                            value: user.createdCourses?.reduce((sum, c) => sum + c.students, 0) || 0,
                            icon: Clock,
                            color: 'bg-orange-500',
                            trend: '+24%'
                        }
                    ].filter(Boolean).map((stat, idx) => (
                        <Card
                            key={idx}
                            className={`stat-card bg-white shadow-md hover:shadow-xl transition-all duration-300 animate-fadeInScale delay-${idx * 100}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                                    <stat.icon className="text-white" size={24}/>
                                </div>
                                <span
                                    className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - User Info */}
                    <div className="space-y-6">
                        <Card title="Thông tin cá nhân" className="shadow-md">
                            <div className="space-y-2">
                                <InfoItem
                                    icon={Mail}
                                    label="Email"
                                    value={user.email}
                                    color="text-blue-600"
                                />
                                <Divider className="my-2"/>
                                <InfoItem
                                    icon={Phone}
                                    label="Số điện thoại"
                                    value={user.phone || 'Chưa cập nhật'}
                                    color="text-green-600"
                                />
                                <Divider className="my-2"/>
                                <InfoItem
                                    icon={Calendar}
                                    label="Ngày sinh"
                                    value={formatDate(user.dob)}
                                    color="text-purple-600"
                                />
                                <Divider className="my-2"/>
                                <InfoItem
                                    icon={MapPin}
                                    label="Giới tính"
                                    value={user.gender ? 'Nam' : 'Nữ'}
                                    color="text-pink-600"
                                />
                            </div>
                        </Card>

                        <Card title="Thông tin hệ thống" className="shadow-md">
                            <div className="space-y-2">
                                <InfoItem
                                    icon={Clock}
                                    label="ID Người dùng"
                                    value={user.pID}
                                    color="text-indigo-600"
                                />
                                <Divider className="my-2"/>
                                <InfoItem
                                    icon={Calendar}
                                    label="Ngày tạo"
                                    value={formatDate(user.createdAt)}
                                    color="text-gray-600"
                                />
                                <Divider className="my-2"/>
                                <InfoItem
                                    icon={Activity}
                                    label="Cập nhật lần cuối"
                                    value={formatDate(user.updatedAt)}
                                    color="text-gray-600"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Main Content - Tables */}
                    <div className="lg:col-span-2 space-y-6">
                        {user.createdCourses && user.createdCourses.length > 0 && (
                            <Panel header="Khóa học đã tạo" className="shadow-md">
                                <div className="data-table-wrapper">
                                    <DataTable
                                        value={user.createdCourses}
                                        paginator
                                        rows={5}
                                        className="text-sm"
                                        emptyMessage="Không có dữ liệu"
                                    >
                                        <Column field="title" header="Tên khóa học" sortable
                                                style={{minWidth: '200px'}}/>
                                        <Column
                                            field="students"
                                            header="Học viên"
                                            sortable
                                            body={(rowData) => (
                                                <Badge value={rowData.students} severity="info" size="large"/>
                                            )}
                                            style={{width: '120px'}}
                                        />
                                        <Column
                                            field="status"
                                            header="Trạng thái"
                                            body={statusTemplate}
                                            style={{width: '120px'}}
                                        />
                                        <Column
                                            field="createdAt"
                                            header="Ngày tạo"
                                            sortable
                                            body={(rowData) => formatDate(rowData.createdAt)}
                                            style={{width: '120px'}}
                                        />
                                        <Column
                                            body={() => (
                                                <Button
                                                    icon="pi pi-eye"
                                                    className="p-button-text p-button-sm"
                                                    tooltip="Xem chi tiết"
                                                />
                                            )}
                                            style={{width: '80px'}}
                                        />
                                    </DataTable>
                                </div>
                            </Panel>
                        )}

                        <Panel header="Khóa học đã chỉnh sửa" className="shadow-md">
                            <div className="data-table-wrapper">
                                <DataTable value={user.editedCourses} className="text-sm">
                                    <Column field="title" header="Tên khóa học" sortable/>
                                    <Column
                                        field="students"
                                        header="Học viên"
                                        body={(rowData) => (
                                            <Badge value={rowData.students} severity="success"/>
                                        )}
                                    />
                                    <Column
                                        field="updatedAt"
                                        header="Cập nhật"
                                        sortable
                                        body={(rowData) => formatDate(rowData.updatedAt)}
                                    />
                                    <Column
                                        body={() => (
                                            <Button
                                                icon="pi pi-external-link"
                                                className="p-button-text p-button-sm"
                                            />
                                        )}
                                    />
                                </DataTable>
                            </div>
                        </Panel>

                        <Panel header="Lớp học quản lý" className="shadow-md">
                            <div className="data-table-wrapper">
                                <DataTable value={user.HRCClass} className="text-sm">
                                    <Column field="name" header="Tên lớp" sortable/>
                                    <Column
                                        field="studentCount"
                                        header="Số học viên"
                                        body={(rowData) => (
                                            <Tag value={rowData.studentCount} severity="warning"
                                                 icon="pi pi-users"/>
                                        )}
                                    />
                                    <Column
                                        field="startDate"
                                        header="Ngày bắt đầu"
                                        sortable
                                        body={(rowData) => formatDate(rowData.startDate)}
                                    />
                                    <Column
                                        body={() => (
                                            <Button
                                                label="Chi tiết"
                                                icon="pi pi-arrow-right"
                                                className="p-button-sm p-button-outlined"
                                            />
                                        )}
                                    />
                                </DataTable>
                            </div>
                        </Panel>

                    </div>
                </div>
            </div>
        </div>
    );
}