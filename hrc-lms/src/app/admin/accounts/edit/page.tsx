"use client";
import {InputText} from 'primereact/inputtext';
import {Password} from 'primereact/password';
import {Dropdown} from 'primereact/dropdown';
import {Calendar} from 'primereact/calendar';
import {FileUpload} from 'primereact/fileupload';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {Divider} from 'primereact/divider';
import {Checkbox} from 'primereact/checkbox';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import * as Yup from "yup";
import {useEffect, useState} from "react";
import {Controller, SubmitHandler, useForm} from "react-hook-form";
import {yupResolver} from '@hookform/resolvers/yup';
import APIClient from "@/lib/api";
import {ResponseModel} from "@/models/ResponseModel";
import {useRouter} from "next/navigation";
import {MultiSelect} from "primereact/multiselect";

interface IUserForm {
    pID: string;
    username: string;
    phone: string;
    email: string;
    password: string;
    avatar: File | null;
    fullname: string;
    gender: boolean;
    dob: Date | null;
    lockoutEnd: Date | null;
    isEmailVerified: boolean;
    roles: Array<number>;
}

const schema = Yup.object({
    pID: Yup.string().required('PID là bắt buộc').max(12, 'PID không được vượt quá 12 ký tự'),
    username: Yup.string().required('Username là bắt buộc').max(50, 'Tối đa 50 ký tự'),
    email: Yup.string().required('Email là bắt buộc').email('Email không đúng định dạng').max(100, 'Tối đa 100 ký tự'),
    password: Yup.string().required('Password là bắt buộc').min(6, 'Ít nhất 6 ký tự'),
    fullname: Yup.string().required('Họ tên là bắt buộc').max(100, 'Tối đa 100 ký tự'),
    phone: Yup.string().nullable().matches(/^\d{10}$/, 'Số điện thoại phải có đúng 10 số').optional(),
    dob: Yup.date().required('Ngày sinh là bắt buộc'),
    gender: Yup.boolean().required(),
    isEmailVerified: Yup.boolean(),
    avatar: Yup.mixed().nullable(),
    lockoutEnd: Yup.date().nullable(),
    roles: Yup.array().nullable(),
});

const UserCreateForm = () => {
    const emptyUser = {
        pID: '',
        username: '',
        phone: '',
        email: '',
        password: '',
        avatar: null,
        fullname: '',
        gender: true,
        dob: null,
        lockoutEnd: null,
        isEmailVerified: false
    };
    const {
        register,
        handleSubmit,
        setValue,
        control,
        watch,
        reset,
        setError,
        formState: {errors, isSubmitting}
    } = useForm<IUserForm>({
        resolver: yupResolver(schema),
        defaultValues: emptyUser,
    });

    const [roles, setRoles] = useState([]);

    const fetchRoles = async () => {
        try {
            const res: ResponseModel = await APIClient.get("/api/protected/roles");
            if (res.status == true) {
                setRoles(res.data);
            } else {
                console.log(res);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const genderOptions = [
        {label: 'Nam', value: true},
        {label: 'Nữ', value: false}
    ];
    const router = useRouter();

    const onSubmit: SubmitHandler<IUserForm> = async (formData) => {
        try {
            const form = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === "avatar" && value instanceof File) {
                    form.append("avatar", value);   // file thật
                } else {
                    form.append(key, value as any);
                }
            });
            console.log(JSON.stringify(formData));
            const res: ResponseModel = await APIClient.post('/api/protected/users', form, {
                headers: {"Content-Type": "multipart/form-data"}
            });

            console.log(res);
        } catch (error) {
            console.warn(error);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [null])

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Card title="Tạo Người Dùng Mới" className="shadow-lg">
                <form className="p-fluid" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* PID */}
                        <div className="field">
                            <label htmlFor="pID" className="block text-sm font-medium mb-2">
                                PID <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="pID"
                                {...register('pID')}
                                placeholder="Nhập PID (tối đa 12 ký tự)"
                                className={errors.pID ? 'p-invalid' : ''}
                            />
                            {errors.pID && <small className="p-error">{errors.pID.message}</small>}
                        </div>

                        {/* Username */}
                        <div className="field">
                            <label htmlFor="username" className="block text-sm font-medium mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="username"
                                {...register('username')}
                                placeholder="Nhập username (tối đa 50 ký tự)"
                                className={errors.username ? 'p-invalid' : ''}
                            />
                            {errors.username && <small className="p-error">{errors.username.message}</small>}
                        </div>

                        {/* Email */}
                        <div className="field">
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="email"
                                type="email"
                                {...register('email')}
                                placeholder="Nhập email (tối đa 100 ký tự)"
                                className={errors.email ? 'p-invalid' : ''}
                            />
                            {errors.email && <small className="p-error">{errors.email.message}</small>}
                        </div>

                        {/* Phone */}
                        <div className="field">
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                Số điện thoại
                            </label>
                            <InputText
                                id="phone"
                                {...register('phone')}
                                placeholder="Nhập số điện thoại (10 số)"
                                maxLength={10}
                                className={errors.phone ? 'p-invalid' : ''}
                            />
                            {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                        </div>

                        {/* Password */}
                        <div className="field">
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <Controller
                                name="password"
                                control={control}
                                render={({field}) => (
                                    <Password
                                        id="password"
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        placeholder="Nhập mật khẩu"
                                        toggleMask
                                        feedback={false}
                                        className={errors.password ? 'p-invalid' : ''}
                                    />
                                )}
                            />
                            {errors.password && <small className="p-error">{errors.password.message}</small>}
                        </div>

                        {/* Full name */}
                        <div className="field">
                            <label htmlFor="fullname" className="block text-sm font-medium mb-2">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="fullname"
                                {...register('fullname')}
                                placeholder="Nhập họ và tên (tối đa 100 ký tự)"
                                className={errors.fullname ? 'p-invalid' : ''}
                            />
                            {errors.fullname && <small className="p-error">{errors.fullname.message}</small>}
                        </div>

                        {/* Gender */}
                        <div className="field">
                            <label htmlFor="gender" className="block text-sm font-medium mb-2">
                                Giới tính <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="gender"
                                value={watch('gender')}
                                onChange={(e) => setValue('gender', e.value)}
                                options={genderOptions}
                                placeholder="Chọn giới tính"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="field">
                            <label htmlFor="dob" className="block text-sm font-medium mb-2">
                                Ngày sinh <span className="text-red-500">*</span>
                            </label>
                            <Calendar
                                id="dob"
                                value={watch('dob')}
                                onChange={(e) => setValue('dob', e.value)}
                                placeholder="Chọn ngày sinh"
                                dateFormat="dd/mm/yy"
                                showIcon
                                maxDate={new Date()}
                                className={errors.dob ? 'p-invalid' : ''}
                            />
                            {errors.dob && <small className="p-error">{errors.dob.message}</small>}
                        </div>

                        {/* Lockout End (Optional) */}
                        <div className="field">
                            <label htmlFor="lockoutEnd" className="block text-sm font-medium mb-2">
                                Ngày hết khóa tài khoản
                            </label>
                            <Calendar
                                id="lockoutEnd"
                                value={watch('lockoutEnd')}
                                onChange={(e) => setValue('lockoutEnd', e.value)}
                                placeholder="Chọn ngày hết khóa (nếu có)"
                                dateFormat="dd/mm/yy"
                                showIcon
                                showTime
                                hourFormat="24"
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="lockoutEnd" className="block text-sm font-medium mb-2">
                                Vị trí
                            </label>
                            <MultiSelect
                                id="role"
                                value={watch('roles')}
                                options={roles}
                                optionLabel="fullname"
                                onChange={(e) => setValue('roles', e.value)}
                                placeholder="Chọn vị trí"
                            />
                        </div>
                    </div>

                    <Divider/>

                    <Divider/>

                    {/* Avatar Upload */}
                    <div className="field">
                        <label className="block text-sm font-medium mb-2">Avatar</label>
                        <FileUpload
                            mode="basic"
                            accept="image/*"
                            maxFileSize={5000000}
                            onSelect={(e) => setValue('avatar', e.files[0])}
                            chooseLabel="Chọn ảnh đại diện"
                            className="mr-2"
                        />
                        <small className="text-gray-500">Chọn file ảnh (tối đa 5MB)</small>
                    </div>

                    {/* Email Verified Checkbox */}
                    <div className="field-checkbox mt-4">
                        <Checkbox
                            inputId="isEmailVerified"
                            checked={watch('isEmailVerified')}
                            onChange={(e) => setValue('isEmailVerified', e.checked)}
                        />
                        <label htmlFor="isEmailVerified" className="ml-2">
                            Email đã được xác thực
                        </label>
                    </div>

                    <Divider/>

                    {/* Submit Button */}
                    <div className="flex justify-center gap-4 mt-6">
                        <Button
                            type="button"
                            label="Quay về"
                            icon="pi pi-arrow-left"
                            className="p-button-secondary"
                            onClick={() => router.back()}
                        />
                        <Button
                            type="button"
                            label="Hủy"
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => reset()}
                        />
                        <Button
                            type="submit"
                            label="Tạo người dùng"
                            icon="pi pi-check"
                            loading={isSubmitting}
                            className="p-button-success"
                        />
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default UserCreateForm;