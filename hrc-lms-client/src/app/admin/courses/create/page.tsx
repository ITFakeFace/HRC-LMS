"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import * as yup from 'yup';
import { useFormik } from 'formik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import api from '@/src/api/api';

interface Category {
  id: number;
  name: string;
}

const validationSchema = yup.object({
  code: yup.string()
    .required('Mã khóa học không được để trống')
    .max(50, 'Mã khóa học tối đa 50 ký tự'),
  name: yup.string()
    .required('Tên khóa học không được để trống')
    .max(255, 'Tên khóa học tối đa 255 ký tự'),
  description: yup.string().optional(),
  duration: yup.string().optional(),
  objectives: yup.array()
    .of(yup.string().required('Mục tiêu không được để trống'))
    .min(1, 'Cần ít nhất 1 mục tiêu')
    .required('Mục tiêu không được để trống'),
  audiences: yup.array().of(yup.string()).optional(),
  requirements: yup.array().of(yup.string()).optional(),
  schedule: yup.array().of(yup.string()).optional(),
  locations: yup.array().of(yup.string()).optional(),
  instructors: yup.array().of(yup.string()).optional(),
  assessment: yup.object({
    part_exam: yup.string().optional(),
    final_exam: yup.string().optional(),
    method: yup.string().optional(),
  }).optional(),
  materials: yup.object({
    mandatory: yup.string().optional(),
    references: yup.string().optional(),
    software: yup.string().optional(),
  }).optional(),
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
  coverImage: yup.string().optional(),
  status: yup.number().optional(),
  categoryIds: yup.array().of(yup.number()).optional(),
});

const CreateCoursePage: React.FC = () => {
  const router = useRouter();
  const toast = React.useRef<Toast>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.status) {
          setCategories(response.data.data);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh mục',
      });
    }
  };

  const formik = useFormik({
    initialValues: {
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
      assessment: {
        part_exam: '',
        final_exam: '',
        method: '',
      },
      materials: {
        mandatory: '',
        references: '',
        software: '',
      },
      contents: [{ title: '', topics: [''] }],
      coverImage: '',
      status: 1,
      categoryIds: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const cleanedData = {
          ...values,
          objectives: values.objectives.filter(v => v.trim()),
          audiences: values.audiences?.filter(v => v.trim()),
          requirements: values.requirements?.filter(v => v.trim()),
          schedule: values.schedule?.filter(v => v.trim()),
          locations: values.locations?.filter(v => v.trim()),
          instructors: values.instructors?.filter(v => v.trim()),
          contents: values.contents.map(c => ({
            ...c,
            topics: c.topics.filter(t => t.trim()),
          })),
        };

        await api.post('/courses', cleanedData);
        toast.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Tạo khóa học thành công',
        });
        setTimeout(() => router.push('/courses'), 1500);
      } catch (error: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: error?.response?.data?.message || 'Không thể tạo khóa học',
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
    const current = formik.values[field as keyof typeof formik.values] as any[];
    formik.setFieldValue(field, [...current, '']);
  };

  const removeArrayItem = (field: string, index: number) => {
    const current = formik.values[field as keyof typeof formik.values] as any[];
    formik.setFieldValue(field, current.filter((_, i) => i !== index));
  };

  const updateArrayItem = (field: string, index: number, value: string) => {
    const current = formik.values[field as keyof typeof formik.values] as any[];
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toast ref={toast} />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tạo khóa học mới</h1>
        <p className="text-gray-600 mt-2">Điền đầy đủ thông tin để tạo khóa học</p>
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
            <FileUpload
              mode="basic"
              accept="image/*"
              maxFileSize={5000000}
              onSelect={handleImageUpload}
              chooseLabel="Chọn hình ảnh"
              className="w-full"
            />
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
                value={formik.values.assessment.part_exam}
                onChange={(e) => formik.setFieldValue('assessment.part_exam', e.target.value)}
                className="w-full"
                placeholder="VD: 30%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thi cuối kỳ</label>
              <InputText
                value={formik.values.assessment.final_exam}
                onChange={(e) => formik.setFieldValue('assessment.final_exam', e.target.value)}
                className="w-full"
                placeholder="VD: 70%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phương thức</label>
              <InputText
                value={formik.values.assessment.method}
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
                value={formik.values.materials.mandatory}
                onChange={(e) => formik.setFieldValue('materials.mandatory', e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tài liệu tham khảo</label>
              <InputTextarea
                value={formik.values.materials.references}
                onChange={(e) => formik.setFieldValue('materials.references', e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phần mềm</label>
              <InputText
                value={formik.values.materials.software}
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
            onClick={() => router.push('/courses')}
          />
          <Button
            type="button"
            label="Tạo khóa học"
            loading={loading}
            className="p-button-primary"
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;