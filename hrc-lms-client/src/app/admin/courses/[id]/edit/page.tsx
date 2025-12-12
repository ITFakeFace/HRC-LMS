"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // useParams để lấy ID
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner'; // Thêm spinner khi load data
import * as yup from 'yup';
import { useFormik } from 'formik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '@/src/api/api';

interface Category {
  id: number;
  name: string;
}

// Schema Validation giữ nguyên
const validationSchema = yup.object({
  code: yup.string()
    .required('Mã khóa học không được để trống')
    .max(50, 'Mã khóa học tối đa 50 ký tự'),
  name: yup.string()
    .required('Tên khóa học không được để trống')
    .max(255, 'Tên khóa học tối đa 255 ký tự'),
  description: yup.string().optional().nullable(),
  duration: yup.string().optional().nullable(),
  objectives: yup.array()
    .of(yup.string().required('Mục tiêu không được để trống'))
    .min(1, 'Cần ít nhất 1 mục tiêu')
    .required('Mục tiêu không được để trống'),
  audiences: yup.array().of(yup.string()).optional().nullable(),
  requirements: yup.array().of(yup.string()).optional().nullable(),
  schedule: yup.array().of(yup.string()).optional().nullable(),
  locations: yup.array().of(yup.string()).optional().nullable(),
  instructors: yup.array().of(yup.string()).optional().nullable(),
  assessment: yup.object({
    part_exam: yup.string().optional().nullable(),
    final_exam: yup.string().optional().nullable(),
    method: yup.string().optional().nullable(),
  }).optional().nullable(),
  materials: yup.object({
    mandatory: yup.string().optional().nullable(),
    references: yup.string().optional().nullable(),
    software: yup.string().optional().nullable(),
  }).optional().nullable(),
  contents: yup.array()
    .of(
      yup.object({
        title: yup.string().required('Tiêu đề không được để trống'),
        topics: yup.array()
          .of(yup.string().required('Chủ đề không được để trống'))
          .min(1, 'Cần ít nhất 1 chủ đề'),
      })
    )
    .min(1, 'Cần ít nhất 1 nội dung')
    .required('Nội dung không được để trống'),
  coverImage: yup.string().optional().nullable(),
  status: yup.number().optional(),
  categoryIds: yup.array().of(yup.number()).optional(),
});

const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const params = useParams(); // Lấy ID từ URL
  const courseId = Number(params.id); // Convert sang number
  
  const toast = React.useRef<Toast>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false); // Loading khi submit
  const [fetching, setFetching] = useState(true); // Loading khi lấy data ban đầu

  // State lưu giá trị khởi tạo cho Form
  const [initialValues, setInitialValues] = useState({
    code: '',
    name: '',
    description: '',
    duration: '',
    objectives: [''],
    audiences: [''],
    requirements: [''],
    schedule: [''],
    locations: [''],
    instructors: [''],
    assessment: { part_exam: '', final_exam: '', method: '' },
    materials: { mandatory: '', references: '', software: '' },
    contents: [{ title: '', topics: [''] }],
    coverImage: '',
    status: 1,
    categoryIds: [],
  });

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      setFetching(true);
      // Gọi song song cả 2 API: Lấy Categories và Lấy chi tiết Course
      const [categoriesRes, courseRes] = await Promise.all([
        api.get('/categories'),
        api.get(`/courses/${courseId}`)
      ]);

      // 1. Set Categories
      if (categoriesRes.data.data) {
        setCategories(categoriesRes.data.data);
      }

      // 2. Set Form Data
      const courseData = courseRes.data.data;
      if (courseData) {
        // Map dữ liệu từ API về Formik format
        setInitialValues({
          code: courseData.code || '',
          name: courseData.name || '',
          description: courseData.description || '',
          duration: courseData.duration || '',
          status: courseData.status ?? 1,
          coverImage: courseData.coverImage || '',
          
          // Xử lý mảng (fallback về mảng chứa 1 chuỗi rỗng nếu null/empty để form không bị lỗi)
          objectives: courseData.objectives?.length ? courseData.objectives : [''],
          audiences: courseData.audiences?.length ? courseData.audiences : [''],
          requirements: courseData.requirements?.length ? courseData.requirements : [''],
          schedule: courseData.schedule?.length ? courseData.schedule : [''],
          locations: courseData.locations?.length ? courseData.locations : [''],
          instructors: courseData.instructors?.length ? courseData.instructors : [''],
          
          // Xử lý Object
          assessment: {
            part_exam: courseData.assessment?.part_exam || '',
            final_exam: courseData.assessment?.final_exam || '',
            method: courseData.assessment?.method || '',
          },
          materials: {
            mandatory: courseData.materials?.mandatory || '',
            references: courseData.materials?.references || '',
            software: courseData.materials?.software || '',
          },
          
          // Xử lý Contents
          contents: courseData.contents?.length 
            ? courseData.contents 
            : [{ title: '', topics: [''] }],

          // Quan trọng: Map mảng object categories [{id:1, name: A}] -> mảng ID [1]
          categoryIds: courseData.categories 
            ? courseData.categories.map((c: any) => c.id) 
            : [],
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải dữ liệu khóa học',
      });
      // Nếu lỗi, quay về trang danh sách sau 2s
      setTimeout(() => router.push('/admin/courses'), 2000);
    } finally {
      setFetching(false);
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true, // Quan trọng: Cho phép form cập nhật khi initialValues thay đổi (sau khi fetch API)
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // Clean data giống trang Create
        const cleanedData = {
          ...values,
          objectives: values.objectives.filter(v => v && v.trim()),
          audiences: values.audiences?.filter(v => v && v.trim()),
          requirements: values.requirements?.filter(v => v && v.trim()),
          schedule: values.schedule?.filter(v => v && v.trim()),
          locations: values.locations?.filter(v => v && v.trim()),
          instructors: values.instructors?.filter(v => v && v.trim()),
          contents: values.contents.map(c => ({
            ...c,
            topics: c.topics.filter(t => t && t.trim()),
          })),
        };

        // GỌI API PUT
        await api.put(`/courses/${courseId}`, cleanedData);
        
        toast.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật khóa học thành công',
        });
        
        // Quay về danh sách sau 1.5s
        setTimeout(() => router.push('/admin/courses'), 1500);
      } catch (error: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: error?.response?.data?.message || 'Không thể cập nhật khóa học',
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    formik.handleSubmit();
  };

  // --- CÁC HÀM HELPER GIỮ NGUYÊN ---
  const handleImageUpload = (e: any) => {
    const file = e.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      formik.setFieldValue('coverImage', base64);
    };
    reader.readAsDataURL(file);
  };

  const addArrayItem = (field: string) => {
    // Ép kiểu để TS không báo lỗi
    const current = (formik.values as any)[field] || [];
    formik.setFieldValue(field, [...current, '']);
  };

  const removeArrayItem = (field: string, index: number) => {
    const current = (formik.values as any)[field] || [];
    formik.setFieldValue(field, current.filter((_: any, i: number) => i !== index));
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    const current = (formik.values as any)[field] || [];
    const updated = [...current];
    updated[index] = value;
    formik.setFieldValue(field, updated);
  };

  const addContentItem = () => {
    formik.setFieldValue('contents', [...formik.values.contents, { title: '', topics: [''] }]);
  };

  const removeContentItem = (index: number) => {
    formik.setFieldValue('contents', formik.values.contents.filter((_, i) => i !== index));
  };

  const addContentTopic = (contentIndex: number) => {
    const updated = [...formik.values.contents];
    updated[contentIndex].topics.push('');
    formik.setFieldValue('contents', updated);
  };

  const removeContentTopic = (contentIndex: number, topicIndex: number) => {
    const updated = [...formik.values.contents];
    updated[contentIndex].topics = updated[contentIndex].topics.filter((_, i) => i !== topicIndex);
    formik.setFieldValue('contents', updated);
  };

  const updateContentTitle = (index: number, value: string) => {
    const updated = [...formik.values.contents];
    updated[index].title = value;
    formik.setFieldValue('contents', updated);
  };

  const updateContentTopic = (contentIndex: number, topicIndex: number, value: string) => {
    const updated = [...formik.values.contents];
    updated[contentIndex].topics[topicIndex] = value;
    formik.setFieldValue('contents', updated);
  };

  const statusOptions = [
    { label: 'Hoạt động', value: 1 },
    { label: 'Không hoạt động', value: 0 },
  ];

  // Nếu đang fetch dữ liệu ban đầu -> Hiển thị loading spinner
  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <ProgressSpinner />
            <p className="mt-2 text-gray-500">Đang tải dữ liệu khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast ref={toast} />
      
      <div className="mb-6 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Chỉnh sửa khóa học</h1>
            <p className="text-gray-600 mt-2">Cập nhật thông tin cho khóa học <span className="font-semibold">{formik.values.code}</span></p>
        </div>
        <Button 
            label="Quay lại" 
            icon="pi pi-arrow-left" 
            className="p-button-outlined" 
            onClick={() => router.push('/admin/courses')} 
        />
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mã khóa học *</label>
              <InputText
                name="code"
                value={formik.values.code}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full"
                placeholder="VD: HRC-RS01"
              />
              {formik.touched.code && formik.errors.code && (
                <small className="text-red-500">{formik.errors.code}</small>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Thời lượng</label>
              <InputText
                name="duration"
                value={formik.values.duration}
                onChange={formik.handleChange}
                className="w-full"
                placeholder="VD: 10 buổi, mỗi buổi 2.5 giờ"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Tên khóa học *</label>
            <InputText
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full"
              placeholder="VD: Thu hút và tuyển chọn nhân sự"
            />
            {formik.touched.name && formik.errors.name && (
              <small className="text-red-500">{formik.errors.name}</small>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Mô tả</label>
            <InputTextarea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              rows={3}
              className="w-full"
              placeholder="Mô tả khóa học..."
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Danh mục</label>
              <MultiSelect
                value={formik.values.categoryIds}
                onChange={(e) => formik.setFieldValue('categoryIds', e.value)}
                options={categories || []}
                optionLabel="name"
                optionValue="id"
                placeholder="Chọn danh mục"
                className="w-full"
                display="chip"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trạng thái</label>
              <Dropdown
                value={formik.values.status}
                onChange={(e) => formik.setFieldValue('status', e.value)}
                options={statusOptions}
                placeholder="Chọn trạng thái"
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Hình ảnh</label>
            <div className="flex items-center gap-4">
                {/* Hiển thị ảnh cũ nếu có */}
                {formik.values.coverImage && (
                    <div className="w-20 h-20 rounded overflow-hidden border">
                         <img 
                            src={`data:image/png;base64,${formik.values.coverImage}`} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')} // Ẩn nếu ảnh lỗi
                         />
                    </div>
                )}
                <FileUpload
                    mode="basic"
                    accept="image/*"
                    maxFileSize={5000000}
                    onSelect={handleImageUpload}
                    chooseLabel={formik.values.coverImage ? "Thay đổi hình ảnh" : "Chọn hình ảnh"}
                    className="w-full"
                />
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Mục tiêu *</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('objectives')}
              className="p-button-sm"
            />
          </div>
          {formik.values.objectives.map((obj, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={obj}
                onChange={(e) => updateArrayItem('objectives', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập mục tiêu..."
              />
              {formik.values.objectives.length > 1 && (
                <Button
                  type="button"
                  icon={<FontAwesomeIcon icon={faTrash} />}
                  onClick={() => removeArrayItem('objectives', idx)}
                  className="p-button-danger p-button-sm"
                />
              )}
            </div>
          ))}
          {formik.touched.objectives && formik.errors.objectives && (
            <small className="text-red-500">{formik.errors.objectives as string}</small>
          )}
        </div>

        {/* Audiences */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Đối tượng học viên</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('audiences')}
              className="p-button-sm"
            />
          </div>
          {formik.values.audiences?.map((aud, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={aud}
                onChange={(e) => updateArrayItem('audiences', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập đối tượng..."
              />
              <Button
                type="button"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => removeArrayItem('audiences', idx)}
                className="p-button-danger p-button-sm"
              />
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Yêu cầu</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('requirements')}
              className="p-button-sm"
            />
          </div>
          {formik.values.requirements?.map((req, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={req}
                onChange={(e) => updateArrayItem('requirements', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập yêu cầu..."
              />
              <Button
                type="button"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => removeArrayItem('requirements', idx)}
                className="p-button-danger p-button-sm"
              />
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Lịch học</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('schedule')}
              className="p-button-sm"
            />
          </div>
          {formik.values.schedule?.map((sch, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={sch}
                onChange={(e) => updateArrayItem('schedule', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập lịch học..."
              />
              <Button
                type="button"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => removeArrayItem('schedule', idx)}
                className="p-button-danger p-button-sm"
              />
            </div>
          ))}
        </div>

        {/* Locations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Địa điểm</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('locations')}
              className="p-button-sm"
            />
          </div>
          {formik.values.locations?.map((loc, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={loc}
                onChange={(e) => updateArrayItem('locations', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập địa điểm..."
              />
              <Button
                type="button"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => removeArrayItem('locations', idx)}
                className="p-button-danger p-button-sm"
              />
            </div>
          ))}
        </div>

        {/* Instructors */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Giảng viên</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm"
              onClick={() => addArrayItem('instructors')}
              className="p-button-sm"
            />
          </div>
          {formik.values.instructors?.map((ins, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <InputText
                value={ins}
                onChange={(e) => updateArrayItem('instructors', idx, e.target.value)}
                className="flex-1"
                placeholder="Nhập thông tin giảng viên..."
              />
              <Button
                type="button"
                icon={<FontAwesomeIcon icon={faTrash} />}
                onClick={() => removeArrayItem('instructors', idx)}
                className="p-button-danger p-button-sm"
              />
            </div>
          ))}
        </div>

        {/* Assessment */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Đánh giá</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Thi từng học phần</label>
              <InputText
                value={formik.values.assessment?.part_exam || ''}
                onChange={(e) => formik.setFieldValue('assessment.part_exam', e.target.value)}
                className="w-full"
                placeholder="VD: 30%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thi cuối kỳ</label>
              <InputText
                value={formik.values.assessment?.final_exam || ''}
                onChange={(e) => formik.setFieldValue('assessment.final_exam', e.target.value)}
                className="w-full"
                placeholder="VD: 70%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phương thức</label>
              <InputText
                value={formik.values.assessment?.method || ''}
                onChange={(e) => formik.setFieldValue('assessment.method', e.target.value)}
                className="w-full"
                placeholder="Phương thức đánh giá..."
              />
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Tài liệu</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Tài liệu bắt buộc</label>
              <InputTextarea
                value={formik.values.materials?.mandatory || ''}
                onChange={(e) => formik.setFieldValue('materials.mandatory', e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tài liệu tham khảo</label>
              <InputTextarea
                value={formik.values.materials?.references || ''}
                onChange={(e) => formik.setFieldValue('materials.references', e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phần mềm</label>
              <InputText
                value={formik.values.materials?.software || ''}
                onChange={(e) => formik.setFieldValue('materials.software', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Contents */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Nội dung khóa học *</h2>
            <Button
              type="button"
              icon={<FontAwesomeIcon icon={faPlus} />}
              label="Thêm buổi học"
              onClick={addContentItem}
              className="p-button-sm"
            />
          </div>
          
          {formik.values.contents.map((content, contentIdx) => (
            <div key={contentIdx} className="border rounded p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <InputText
                  value={content.title}
                  onChange={(e) => updateContentTitle(contentIdx, e.target.value)}
                  className="flex-1"
                  placeholder="VD: Buổi 1"
                />
                {formik.values.contents.length > 1 && (
                  <Button
                    type="button"
                    icon={<FontAwesomeIcon icon={faTrash} />}
                    onClick={() => removeContentItem(contentIdx)}
                    className="p-button-danger p-button-sm"
                  />
                )}
              </div>

              <div className="ml-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Chủ đề</label>
                  <Button
                    type="button"
                    icon={<FontAwesomeIcon icon={faPlus} />}
                    label="Thêm chủ đề"
                    onClick={() => addContentTopic(contentIdx)}
                    className="p-button-sm p-button-text"
                    size="small"
                  />
                </div>
                
                {content.topics.map((topic, topicIdx) => (
                  <div key={topicIdx} className="flex gap-2 mb-2">
                    <InputText
                      value={topic}
                      onChange={(e) => updateContentTopic(contentIdx, topicIdx, e.target.value)}
                      className="flex-1"
                      placeholder="Nhập chủ đề..."
                    />
                    {content.topics.length > 1 && (
                      <Button
                        type="button"
                        icon={<FontAwesomeIcon icon={faTrash} />}
                        onClick={() => removeContentTopic(contentIdx, topicIdx)}
                        className="p-button-danger p-button-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {formik.touched.contents && formik.errors.contents && (
            <small className="text-red-500">{formik.errors.contents as string}</small>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            label="Hủy"
            className="p-button-secondary"
            onClick={() => router.push('/admin/courses')}
          />
          <Button
            type="button"
            label="Cập nhật khóa học"
            loading={loading}
            className="p-button-primary"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default EditCoursePage;