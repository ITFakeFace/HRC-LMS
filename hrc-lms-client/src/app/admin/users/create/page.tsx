"use client";

import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import * as yup from 'yup';
import api from '@/src/api/api'; // Đảm bảo import đúng đường dẫn api instance của bạn
import { ApiResponse } from '@/src/features/auth/interfaces/ApiResponse.interface';

// --- INTERFACES ---

// 1. Interface cho Role trả về từ API
interface Role {
  id: number;
  shortname: string;
  fullname: string;
}

interface UserFormData {
  pID: string;
  username: string;
  phone: string;
  email: string;
  password: string;
  fullname: string;
  gender: boolean;
  dob: Date | null;
  roles: number[]; // Lưu mảng ID của role
}

type ValidationErrors = Partial<Record<keyof UserFormData, string[]>>;

// --- VALIDATION SCHEMA ---
const userSchema = yup.object().shape({
  pID: yup.string().required('pID is required').max(12, 'pID must not exceed 12 characters'),
  username: yup.string().required('Username is required').max(50, 'Username must not exceed 50 characters'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits').nullable(),
  email: yup.string().required('Email is required').email('Invalid email format').max(100, 'Email must not exceed 100 characters'),
  password: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters').max(255, 'Password must not exceed 255 characters'),
  fullname: yup.string().required('Full name is required').max(100, 'Full name must not exceed 100 characters'),
  gender: yup.boolean().required('Gender is required'),
  dob: yup.date().required('Date of birth is required').nullable(),
  roles: yup.array().of(yup.number().required()).min(1, 'At least one role must be selected')
});

export default function CreateUserPage() {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 2. State để lưu danh sách Role từ API
  const [rolesList, setRolesList] = useState<Role[]>([]);

  const [formData, setFormData] = useState<UserFormData>({
    pID: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    fullname: '',
    gender: true,
    dob: null,
    roles: []
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // 3. Fetch Roles khi component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/roles');
        const data = response.data;
        if (data.status) {
          // Lưu trực tiếp dữ liệu từ API vào state
          setRolesList(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
        toast.current?.show({ severity: 'error', summary: 'System', detail: 'Không thể tải danh sách quyền hạn' });
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    setLoading(true);

    try {
      await userSchema.validate(formData, { abortEarly: false });

      // Xử lý dữ liệu trước khi gửi
      const submitData = {
        ...formData,
        // Chỉnh lại timezone cho ngày sinh
        dob: formData.dob ? new Date(formData.dob.getTime() - (formData.dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null,
        phone: formData.phone && formData.phone.trim() !== '' ? formData.phone : null 
      };

      const response = await api.post("/users", submitData);
      const data: ApiResponse<any> = response.data;

      if (data.status) {
        toast.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: data.message,
          life: 3000
        });
        
        // Reset form
        setFormData({
          pID: '',
          username: '',
          phone: '',
          email: '',
          password: '',
          fullname: '',
          gender: true,
          dob: null,
          roles: []
        });
        window.location.href = "/admin/users";
      } else {
        // Xử lý lỗi logic từ backend
        if (data.errors && data.errors.length > 0) {
          const newErrors: ValidationErrors = {};
          data.errors.forEach((err: any) => {
            const fieldKey = err.key as keyof UserFormData;
            newErrors[fieldKey] = err.value;
          });
          setErrors(newErrors);
        }
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: data.message,
          life: 3000
        });
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        // Lỗi validate client (Yup)
        const validationErrors: ValidationErrors = {};
        (err as yup.ValidationError).inner.forEach(error => {
          if (error.path) {
            const fieldKey = error.path as keyof UserFormData;
            validationErrors[fieldKey] = [error.message];
          }
        });
        setErrors(validationErrors);
      } else {
        // Lỗi server/network
        const serverMessage = err.response?.data?.message || 'Đã xảy ra lỗi hệ thống';
        
        // Check nếu server trả về errors array trong bad request (400)
        if (err.response?.data?.errors) {
            const newErrors: ValidationErrors = {};
            err.response.data.errors.forEach((e: any) => {
                const fieldKey = e.key as keyof UserFormData;
                newErrors[fieldKey] = e.value;
            });
            setErrors(newErrors);
        }

        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: serverMessage,
          life: 3000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field: keyof UserFormData) => {
    if (errors[field] && errors[field]!.length > 0) {
      return (
        <div className="mt-1">
          {errors[field]!.map((msg, idx) => (
            <small key={idx} className="text-red-600 block">{msg}</small>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toast ref={toast} />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
           <h1 className="text-3xl font-bold text-gray-800 mb-6">Tạo người dùng mới</h1>

           <div className="space-y-6">
              {/* Các trường input khác (pID, username, email...) giữ nguyên như cũ */}
              
              <div>
                <label htmlFor="pID" className="block text-sm font-medium text-gray-700 mb-2">Personal ID <span className="text-red-500">*</span></label>
                <InputText id="pID" value={formData.pID} onChange={(e) => handleChange('pID', e.target.value)} className={`w-full ${errors.pID ? 'border-red-500' : ''}`} placeholder="Nhập số CCCD" />
                {renderError('pID')}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
                <InputText id="username" value={formData.username} onChange={(e) => handleChange('username', e.target.value)} className={`w-full ${errors.username ? 'border-red-500' : ''}`} placeholder="Nhập tên đăng nhập" />
                {renderError('username')}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <InputText id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full ${errors.email ? 'border-red-500' : ''}`} placeholder="Nhập địa chỉ email" />
                {renderError('email')}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <InputText id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full ${errors.phone ? 'border-red-500' : ''}`} placeholder="Nhập số điện thoại" />
                {renderError('phone')}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                <Password id="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className={`w-full ${errors.password ? 'border-red-500' : ''}`} inputClassName="w-full" placeholder="Nhập mật khẩu" toggleMask feedback={false} />
                {renderError('password')}
              </div>

              <div>
                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <InputText id="fullname" value={formData.fullname} onChange={(e) => handleChange('fullname', e.target.value)} className={`w-full ${errors.fullname ? 'border-red-500' : ''}`} placeholder="Nhập họ và tên" />
                {renderError('fullname')}
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
                <Calendar id="dob" value={formData.dob} onChange={(e) => handleChange('dob', e.value)} className={`w-full ${errors.dob ? 'border-red-500' : ''}`} dateFormat="yy-mm-dd" placeholder="Chọn ngày sinh" showIcon maxDate={new Date()} />
                {renderError('dob')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center">
                    <Checkbox inputId="male" checked={formData.gender === true} onChange={() => handleChange('gender', true)} />
                    <label htmlFor="male" className="ml-2 cursor-pointer">Nam</label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox inputId="female" checked={formData.gender === false} onChange={() => handleChange('gender', false)} />
                    <label htmlFor="female" className="ml-2 cursor-pointer">Nữ</label>
                  </div>
                </div>
                {renderError('gender')}
              </div>

             {/* 4. MultiSelect đã được cập nhật */}
             <div>
              <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <MultiSelect
                id="roles"
                value={formData.roles}
                onChange={(e) => handleChange('roles', e.value)}
                options={rolesList}      // Sử dụng danh sách lấy từ API
                optionLabel="fullname"   // Hiển thị tên đầy đủ (VD: SUPER_ADMINISTRATOR)
                optionValue="id"         // Giá trị lưu vào form là ID (VD: 3)
                placeholder="Chọn quyền hạn"
                className={`w-full ${errors.roles ? 'border-red-500' : ''}`}
                display="chip"
                filter // Thêm tính năng tìm kiếm nếu danh sách role dài
              />
              {renderError('roles')}
            </div>

             <div className="flex gap-4 pt-4">
              <Button type="button" label="Tạo User" icon="pi pi-check" loading={loading} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded" />
              <Button 
                type="button" 
                label="Làm mới" 
                icon="pi pi-refresh" 
                severity="secondary" 
                onClick={() => {
                   setFormData({ pID: '', username: '', phone: '', email: '', password: '', fullname: '', gender: true, dob: null, roles: [] });
                   setErrors({});
                }} 
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded" 
              />
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}