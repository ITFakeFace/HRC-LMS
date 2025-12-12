"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Hook để lấy ID và điều hướng
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import * as yup from 'yup';
import api from '@/src/api/api';
import { ApiResponse } from '@/src/features/auth/interfaces/ApiResponse.interface';

// --- INTERFACES ---

interface Role {
  id: number;
  shortname: string;
  fullname: string;
}

interface UserFormData {
  id?: number | string; // Thêm ID vào form data để tiện xử lý
  pID: string;
  username: string;
  phone: string;
  email: string;
  password: string; // Password sẽ optional khi gửi đi
  fullname: string;
  gender: boolean;
  dob: Date | null;
  roles: number[];
}

type ValidationErrors = Partial<Record<keyof UserFormData, string[]>>;

// --- VALIDATION SCHEMA CHO UPDATE ---
// Password không bắt buộc (nếu để trống nghĩa là không đổi)
const updateUserSchema = yup.object().shape({
  pID: yup.string().required('pID is required').max(12, 'pID must not exceed 12 characters'),
  username: yup.string().required('Username is required').max(50, 'Username must not exceed 50 characters'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits').nullable(),
  email: yup.string().required('Email is required').email('Invalid email format').max(100, 'Email must not exceed 100 characters'),
  // Password: Cho phép null hoặc empty string. Nếu có nhập thì phải > 8 ký tự
  password: yup.lazy((value) => 
    !value ? yup.string().notRequired() : yup.string().min(8, 'Password must be at least 8 characters').max(255)
  ),
  fullname: yup.string().required('Full name is required').max(100, 'Full name must not exceed 100 characters'),
  gender: yup.boolean().required('Gender is required'),
  dob: yup.date().required('Date of birth is required').nullable(),
  roles: yup.array().of(yup.number().required()).min(1, 'At least one role must be selected')
});

export default function EditUserPage() {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const params = useParams(); 
  const userId = params?.id; // Lấy ID từ URL

  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true); // Loading khi fetch data ban đầu
  
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

  // 1. Fetch Roles và User Data khi component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setDataLoading(true);
      try {
        // Chạy song song cả 2 API để tối ưu tốc độ
        const [rolesRes, userRes] = await Promise.all([
          api.get('/roles'),
          api.get(`/users/${userId}`) // Giả sử API get detail là GET /users/{id}
        ]);
        console.log(userRes.data)
        // Xử lý Roles
        if (rolesRes.data.status) {
          setRolesList(rolesRes.data.data);
        }

        // Xử lý User Data
        const userData = userRes.data.data; // Cấu trúc tùy backend, giả sử data nằm trong data.data
        if (userRes.data.status) {
          setFormData({
            id: userData.id,
            pID: userData.pID || '',
            username: userData.username || '',
            phone: userData.phone || '',
            email: userData.email || '',
            password: '', // Luôn để trống password khi edit
            fullname: userData.fullname || '',
            gender: userData.gender,
            // Convert string date từ API sang Date object cho Calendar
            dob: userData.dob ? new Date(userData.dob) : null,
            // Map mảng object roles sang mảng ID: [{id:1, name:...}] -> [1]
            roles: userData.roles ? userData.roles.map((r: any) => r.id) : [] 
          });
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải thông tin người dùng' });
        // Nếu lỗi tải user, có thể redirect về trang danh sách sau vài giây
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error khi user nhập liệu
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
      await updateUserSchema.validate(formData, { abortEarly: false });

      // Xử lý dữ liệu trước khi gửi
      const submitData: any = {
        ...formData,
        // Chỉnh lại timezone cho ngày sinh
        dob: formData.dob ? new Date(formData.dob.getTime() - (formData.dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null,
        phone: formData.phone && formData.phone.trim() !== '' ? formData.phone : null 
      };

      // Nếu password rỗng, xóa khỏi payload để backend không update password
      if (!submitData.password || submitData.password.trim() === '') {
        delete submitData.password;
      }

      // Gọi API PUT
      // Lưu ý: Đường dẫn API tùy thuộc backend bạn. 
      // Thường là PUT /users/${userId} hoặc PUT /users (với id trong body)
      const response = await api.put(`/users/${userId}`, submitData); 
      const data: ApiResponse<any> = response.data;

      if (data.status) {
        toast.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật người dùng thành công',
          life: 2000
        });
        
        // Delay 1 chút rồi chuyển trang
        setTimeout(() => {
            router.push('/admin/users');
        }, 1000);

      } else {
        // Xử lý lỗi logic từ backend trả về
        if (data.errors && data.errors.length > 0) {
          const newErrors: ValidationErrors = {};
          data.errors.forEach((err: any) => {
            const fieldKey = err.key as keyof UserFormData;
            newErrors[fieldKey] = err.value;
          });
          setErrors(newErrors);
        }
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: data.message });
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
        // Lỗi server
        const serverMessage = err.response?.data?.message || 'Đã xảy ra lỗi hệ thống';
        if (err.response?.data?.errors) {
            const newErrors: ValidationErrors = {};
            err.response.data.errors.forEach((e: any) => {
                const fieldKey = e.key as keyof UserFormData;
                newErrors[fieldKey] = e.value;
            });
            setErrors(newErrors);
        }
        toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: serverMessage });
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

  if (dataLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <ProgressSpinner />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toast ref={toast} />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
           <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Cập nhật người dùng</h1>
                <Button label="Quay lại" icon="pi pi-arrow-left" text onClick={() => router.back()} />
           </div>

           <div className="space-y-6">
              <div>
                <label htmlFor="pID" className="block text-sm font-medium text-gray-700 mb-2">Personal ID <span className="text-red-500">*</span></label>
                <InputText id="pID" value={formData.pID} onChange={(e) => handleChange('pID', e.target.value)} className={`w-full ${errors.pID ? 'border-red-500' : ''}`} placeholder="Nhập số CCCD" />
                {renderError('pID')}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username <span className="text-red-500">*</span></label>
                {/* Username thường không cho sửa, nếu cho sửa thì bỏ disabled */}
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password (Để trống nếu không đổi)</label>
                <Password 
                    id="password" 
                    value={formData.password} 
                    onChange={(e) => handleChange('password', e.target.value)} 
                    className={`w-full ${errors.password ? 'border-red-500' : ''}`} 
                    inputClassName="w-full" 
                    placeholder="Nhập mật khẩu mới" 
                    toggleMask 
                    feedback={formData.password.length > 0} 
                />
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

             <div>
              <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-2">
                Roles <span className="text-red-500">*</span>
              </label>
              <MultiSelect
                id="roles"
                value={formData.roles}
                onChange={(e) => handleChange('roles', e.value)}
                options={rolesList}
                optionLabel="fullname"
                optionValue="id"
                placeholder="Chọn quyền hạn"
                className={`w-full ${errors.roles ? 'border-red-500' : ''}`}
                display="chip"
                filter 
              />
              {renderError('roles')}
            </div>

             <div className="flex gap-4 pt-4">
              <Button type="button" label="Lưu thay đổi" icon="pi pi-save" loading={loading} onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded" />
              <Button 
                type="button" 
                label="Hủy bỏ" 
                icon="pi pi-times" 
                severity="secondary" 
                onClick={() => router.push('/admin/users')} 
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded" 
              />
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}