'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import api from '@/src/api/api';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string;
  duration: string;
  status: number;
  coverImage: string | null;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  status: boolean;
  statusCode: number;
  message: string;
  errors: any[];
  data: Course[];
}

export default function CourseListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const toast = React.useRef<Toast>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Thay thế bằng api.get('/courses') trong project thực tế
      const response = await api.get('/courses');
      const result: ApiResponse = response.data;
      
      if (result.status) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách khóa học',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (course: Course) => {
    setSelectedCourse(course);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      // Thay thế bằng api.delete(`/courses/${selectedCourse.id}`) trong project thực tế
      await api.delete(`/courses/${selectedCourse.id}`);

      toast.current?.show({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa khóa học',
        life: 3000
      });

      setCourses(courses.filter(c => c.id !== selectedCourse.id));
      setDeleteDialog(false);
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa khóa học',
        life: 3000
      });
    }
  };

  const imageBodyTemplate = (rowData: Course) => {
    return (
      <div className="flex justify-center items-center">
        {rowData.coverImage ? (
          <Image
            src={rowData.coverImage}
            alt={rowData.name}
            width="60"
            height="60"
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faBook} className="text-blue-500 text-2xl" />
          </div>
        )}
      </div>
    );
  };

  const categoryBodyTemplate = (rowData: Course) => {
    return (
      <div className="flex gap-2 flex-wrap">
        {rowData.categories.map((cat) => (
          <Tag key={cat.id} value={cat.name} className="bg-blue-500" />
        ))}
      </div>
    );
  };

  const descriptionBodyTemplate = (rowData: Course) => {
    return (
      <div className="max-w-md">
        <p className="text-sm text-gray-700 line-clamp-2">{rowData.description}</p>
      </div>
    );
  };

  const actionBodyTemplate = (rowData: Course) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-info p-button-sm"
          tooltip="Chi tiết"
          tooltipOptions={{ position: 'top' }}
          onClick={() => window.location.href = `/admin/courses/${rowData.id}`}
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-warning p-button-sm"
          tooltip="Chỉnh sửa"
          tooltipOptions={{ position: 'top' }}
          onClick={() => window.location.href = `/admin/courses/${rowData.id}/edit`}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-danger p-button-sm"
          tooltip="Xóa"
          tooltipOptions={{ position: 'top' }}
          onClick={() => confirmDelete(rowData)}
        />
      </div>
    );
  };

  const deleteDialogFooter = (
    <div>
      <Button
        label="Hủy"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Xóa"
        icon="pi pi-check"
        className="p-button-danger"
        onClick={handleDelete}
      />
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <Toast ref={toast} />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Danh sách khóa học</h1>
          <Button
            label="Thêm khóa học"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => window.location.href = '/admin/courses/create'}
          />
        </div>

        <DataTable
          value={courses}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          dataKey="id"
          className="p-datatable-sm"
          emptyMessage="Không có khóa học nào"
          currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} khóa học"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        >
          <Column
            field="id"
            header="ID"
            sortable
            style={{ width: '5%' }}
            className="font-semibold"
          />
          <Column
            field="code"
            header="Mã khóa"
            sortable
            style={{ width: '10%' }}
          />
          <Column
            header="Hình đại diện"
            body={imageBodyTemplate}
            style={{ width: '10%' }}
          />
          <Column
            field="name"
            header="Tên khóa học"
            sortable
            style={{ width: '20%' }}
            className="font-medium"
          />
          <Column
            header="Thể loại"
            body={categoryBodyTemplate}
            style={{ width: '15%' }}
          />
          <Column
            header="Mô tả"
            body={descriptionBodyTemplate}
            style={{ width: '25%' }}
          />
          <Column
            header="Hành động"
            body={actionBodyTemplate}
            style={{ width: '15%' }}
          />
        </DataTable>
      </div>

      <Dialog
        visible={deleteDialog}
        style={{ width: '450px' }}
        header="Xác nhận xóa"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialog(false)}
      >
        <div className="flex items-center gap-4">
          <i className="pi pi-exclamation-triangle text-red-500 text-3xl" />
          <span>
            Bạn có chắc chắn muốn xóa khóa học{' '}
            <strong>{selectedCourse?.name}</strong> không?
          </span>
        </div>
      </Dialog>
    </div>
  );
}