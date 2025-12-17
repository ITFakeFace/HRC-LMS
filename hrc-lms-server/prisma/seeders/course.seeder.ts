import { PrismaClient } from '@prisma/client';

// 1. Hàm helper để tạo slug từ tiếng Việt (Không cần cài thêm thư viện)
function stringToSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD') // Tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
    .replace(/(\s+)/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-') // Xóa gạch ngang dư thừa
    .replace(/^-+|-+$/g, ''); // Xóa gạch ngang ở đầu và cuối
}

// Dữ liệu JSON thô
const rawCourses = [
  {
    name: 'Thu hút và tuyển chọn nhân sự',
    code: 'HRC-RS01',
    objectives: [
      'Kiến thức cơ bản liên quan đến việc tuyển dụng nhân sự cho doanh nghiệp',
      'Kiến thức về quy trình tuyển dụng nhân sự: lập kế hoạch, xây dựng nguồn tuyển và sàng lọc ứng viên',
      'Kỹ năng xây dựng thương hiệu nhà tuyển dụng qua kỹ thuật SEO',
      'Kỹ năng tuyển dụng nhân sự',
      'Ứng dụng nhân tướng học, thần số học vào việc tuyển chọn ứng viên',
      'Phân tích và nắm bắt tâm lý ứng viên trong quá trình phỏng vấn xin việc',
      'Áp dụng các kiến thức, kỹ năng đã học vào tình huống phỏng vấn thực tế do giảng viên cung cấp',
    ],
    audiences: [
      'Người học trái nghề muốn theo nghề nhân sự nghiệp vụ tuyển dụng',
      'Người học muốn củng cố kiến thức về nghiệp vụ tuyển dụng trong quản trị nhân sự',
      'Người học muốn nâng cao kỹ năng tuyển dụng để phát triển sự nghiệp',
      'Người học muốn tìm hiểu các vấn đề liên quan đến tâm lý học nhân sự và nghệ thuật nhìn người để ứng dụng trong việc nắm bắt tâm lý nhân viên trong tổ chức',
    ],
    requirements: [
      'Có hiểu biết về quản trị nhân sự tổng quan',
      'Có thời gian, quyết tâm để ra nghề',
      'Có nhu cầu tìm việc nghề quản lý nhân sự',
    ],
    duration: '10 buổi, mỗi buổi 2.5 giờ',
    schedule: [
      'Thứ 7 14h-16h30 và sáng CN 9h-11h30',
      'Thứ 2, 4, 6 18h-20h30',
      'Thứ 3, 5, 7 18h-20h30',
    ],
    locations: [
      'Tòa nhà Phương Nam education – 357 Lê Hồng Phong',
      'Quang Trung, Q. Gò Vấp',
    ],
    assessment: {
      part_exam:
        'Kiểm tra từng học phần: 30% (tạo thương hiệu nhà tuyển dụng, xây dựng nguồn tuyển, viết và đánh giá CV, kỹ thuật phỏng vấn ứng viên)',
      final_exam:
        'Kiểm tra cuối kỳ: 70% (bài trắc nghiệm, tự luận và tình huống phỏng vấn xin việc)',
    },
    contents: {
      'buổi 1': [
        'Tổng quan về chính sách thu hút và tuyển dụng nhân sự',
        'Quy trình tuyển dụng',
        'Quan điểm tuyển chọn ứng viên',
        'Các yếu tố xây dựng thương hiệu nhà tuyển dụng',
        'Bài tập thực hành',
        'Kiểm tra học phần',
      ],
      'buổi 2': [
        'Lập kế hoạch tuyển dụng',
        'Các yếu tố cần có trong lập kế hoạch tuyển dụng',
        'Ngân sách tuyển dụng',
        'Các pháp lý liên quan đến tuyển dụng',
        'Nguồn tuyển dụng',
        'Bài tập',
        'Kiểm tra học phần',
      ],
      'buổi 3': [
        'Xây dựng chính sách thu hút ứng viên',
        'Phân tích công việc',
        'Thiết kế quảng cáo tuyển dụng hiệu quả',
        'Thực hành',
        'Kiểm tra học phần',
      ],
      'buổi 4': [
        'Kỹ năng viết CV ấn tượng',
        'Kỹ năng đánh giá và sàn lọc CV',
        'Thực hành',
        'Kiểm tra học phần',
      ],
      'buổi 5-6-7': [
        'Thuật nhìn người qua nhiều phương pháp',
        'Thần số học',
        'Bút tích, chiêm tinh học',
        'Nhân tướng học',
        'Tâm lý học ứng dụng',
      ],
      'buổi 8-9': [
        'Các phương pháp tuyển chọn ứng viên',
        'Các bước phỏng vấn ứng viên hiệu quả',
        'Kỹ năng phỏng vấn ứng viên',
        'Thực hành kỹ năng phỏng vấn ứng viên',
      ],
      'buổi 10': [
        'Kiểm tra cuối kỳ',
        'Cấp giấy chứng nhận, bảng điểm do HRC cấp',
      ],
    },
    materials: {
      mandatory:
        'Nguyễn Thanh Vân, Cẩm nang nghiệp vụ tuyển dụng, 2019, VNHURS edition (do HRC soạn thảo, cung cấp miễn phí)',
      references:
        'Tài liệu do giảng viên phụ trách cung cấp, đã qua kiểm định chất lượng của HRC',
      software: 'PowerPoint, Word, Canva hoặc các phần mềm hỗ trợ viết CV',
    },
    instructors: [
      'Nguyễn Thanh Vân, MBA, 15 năm kinh nghiệm giảng dạy ngành Quản trị nhân sự',
    ],
  },
  {
    name: 'Quản trị chính sách lương và đãi ngộ toàn diện',
    code: 'HRC-CB',
    objectives: [
      'Kiến thức cơ bản liên quan đến việc trả lương cho người lao động tại doanh nghiệp',
      'Kiến thức về pháp lý liên quan đến lao động như luật lao động, luật bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp, công đoàn, xử lý thôi việc…',
      'Kỹ năng Excel, Power BI, Word liên quan đến việc trả lương và các thủ tục báo cáo nhân sự định kỳ',
      'Vận dụng kiến thức đã học vào việc tính lương, trả lương và xây dựng chính sách đãi ngộ cho người lao động',
      'Áp dụng các kiến thức, kỹ năng đã học vào tình huống và dữ liệu thực tế do giảng viên cung cấp',
    ],
    audiences: [
      'Người học trái nghề muốn theo nghề nhân sự nghiệp vụ trả lương và quan hệ lao động',
      'Người học muốn củng cố kiến thức về nghiệp vụ trả lương trong quản trị nhân sự',
      'Người học muốn nâng cao kỹ năng tính lương, thưởng, phúc lợi để phát triển sự nghiệp',
      'Người học muốn tìm hiểu các vấn đề liên quan đến quản lý đãi ngộ người lao động để thiết kế phần mềm hệ thống quản lý nhân sự',
    ],
    requirements: [
      'Đã học qua khoá quản trị nhân sự tổng quan',
      'Có máy laptop mang theo để thực hành tại chỗ học',
      'Có máy tính tiền',
      'Có thời gian, quyết tâm để ra nghề',
    ],
    duration: '16 buổi, mỗi buổi 2.5 giờ',
    schedule: ['Thứ 7 14h-16h30 và sáng CN 9h-11h30', 'Thứ 3, 5 18h-20h30'],
    locations: ['Online: Trên nền tảng Zoom', 'Offline: Sư Vạn Hạnh, Quận 10'],
    assessment: {
      part_exam:
        'Kiểm tra từng học phần: 30% (pháp lý lao động, kỹ năng vi tính, bảng tính lương)',
      final_exam:
        'Kiểm tra cuối kỳ: 70% (bài trắc nghiệm, tự luận và bài tập bảng tính lương)',
    },
    contents: {
      'buổi 1': [
        'Tổng quan về quản trị chính sách lương và đãi ngộ toàn diện',
        'Quan điểm trả lương',
        'Các yếu tố đãi ngộ toàn diện',
        'Mô hình trả lương theo 3Ps',
      ],
      'buổi 2-3': [
        'Pháp lý liên quan đến lao động tổng quan',
        'Luật lao động: hợp đồng lao động, OT, thời gian làm việc, thời gian nghỉ ngơi',
        'Luật lao động: phép năm, nghỉ có hưởng lương, nghỉ không hưởng lương',
        'Luật lao động: phụ cấp trong lương và ngoài lương',
        'Luật lao động: phụ cấp có và miễn đóng bảo hiểm',
        'Luật lao động: các loại thu nhập miễn và có đóng thuế thu nhập cá nhân',
      ],
      'buổi 4-5': [
        'Luật bảo hiểm xã hội và các chế độ liên quan',
        'Luật bảo hiểm y tế',
        'Luật bảo hiểm thất nghiệp',
        'Luật thuế thu nhập cá nhân',
        'Xử lý thôi việc và các vấn đề liên quan',
      ],
      'buổi 6': ['Kiểm tra học phần pháp lý liên quan đến lao động'],
      'buổi 7-11': [
        'Ứng dụng các hàm Excel căn bản trong việc trả lương: hàm lọc, hàm tìm, hàm chọn, hàm điều kiện…',
        'Thực hành',
      ],
      'buổi 12-14': [
        'Ứng dụng chức năng merge, mail merge trong Word',
        'Ứng dụng Power BI trong báo cáo nhân sự định kỳ',
        'Kiểm tra học phần kỹ năng vi tính trong nghiệp vụ trả lương',
      ],
      'buổi 15-16': [
        'Thực hành bảng chấm công',
        'Thực hành tính OT và các loại phép',
      ],
      'buổi 17-18': [
        'Thực hành tính BHXH, BHYT, BHTN, phí công đoàn',
        'Thực hành tính thuế thu nhập cá nhân',
      ],
      'buổi 19-20': [
        'Thực hành lập bảng tính lương',
        'Thực hành tính thưởng, thưởng theo thành tích, các loại thưởng',
      ],
      'buổi 22-23': [
        'Thực hành bảng tính lương NET',
        'Kiểm tra học phần bảng tính lương',
      ],
      'buổi 24': [
        'Kiểm tra cuối kỳ',
        'Cấp giấy chứng nhận, bảng điểm do HRC cấp',
      ],
    },
    materials: {
      mandatory:
        'Nguyễn Thanh Vân, Quản trị chính sách lương và đãi ngộ toàn diện, 2021, VNHURS edition (do HRC soạn thảo, cung cấp miễn phí)',
      references:
        'Tài liệu do giảng viên phụ trách cung cấp, đã qua kiểm định chất lượng của HRC',
      software: 'Microsoft Excel, Power BI, Word',
    },
    instructors: [
      'Nguyễn Thanh Vân: MBA, 15 năm kinh nghiệm giảng dạy ngành Quản trị nhân sự',
      'Đặng Quỳnh Mi: C&B Manager của Pepsico, hơn 10 năm công tác trả lương',
      'Trương Đinh Hải Thụy: Tiến sỹ, Trưởng khoa Công nghệ thông tin',
    ],
  },
  {
    name: 'Nghệ thuật nhìn người và nắm bắt tâm lý người khác qua nhiều phương pháp',
    code: 'HRC-P0',
    objectives: [
      'Kiến thức cơ bản về quan điểm nhìn tướng và nắm bắt tâm lý người khác',
      'Kỹ năng phân tích và nhìn nhận tính cách người khác qua nhiều phương pháp như: chữ viết, chữ ký, nhân tướng mặt, nhân tướng mệnh, tâm lý học nhân sự',
      'Áp dụng các kiến thức đã học để thực hành tình huống thực tế',
    ],
    audiences: [
      'Người học muốn tìm hiểu về nhân tướng học căn bản',
      'Người học muốn rèn luyện nâng cao kỹ năng nắm bắt tâm lý và tính cách người khác qua nhiều phương pháp',
      'Người học muốn phát triển nghề nghiệp và thuận lợi trong việc giao tiếp với đối phương thông qua kỹ thuật đọc vị người khác',
    ],
    requirements: ['Có niềm tin về nhân tướng học'],
    duration: '4 buổi, mỗi buổi 2.5 giờ',
    schedule: [
      'Thứ 7 14h-16h30 và sáng CN 9h-11h30',
      'Thứ 2, 4, 6 18h-20h30',
      'Thứ 3, 5, 7 18h-20h30',
    ],
    locations: [
      'Tòa nhà Phương Nam education – 357 Lê Hồng Phong',
      'Quang Trung, Q. Gò Vấp',
    ],
    assessment: {
      method:
        'Khóa học này thực hành tại lớp học, không triển khai dạy online, và không kiểm tra kiến thức cuối khóa',
    },
    contents: {
      'buổi 1': [
        'Quan điểm về thuật nhân tướng học',
        'Ưu và nhược điểm của phương pháp nhân tướng học',
        'Các tình huống thực tế dẫn chứng cho sự tồn tại của phương pháp nhân tướng học',
        'Giới thiệu các phương pháp cần tìm hiểu',
        'Phương pháp nhận diện con người qua chữ viết, chữ ký',
        'Thực hành tại lớp học',
      ],
      'buổi 2': [
        'Nhân tướng mặt',
        'Các điểm nét trên gương mặt cần phân tích và nhận dạng',
        'Thực hành tại lớp học',
      ],
      'buổi 3': [
        'Nhân tướng mặt (tt)',
        'Nhân tướng mệnh',
        'Phân tích các tướng mệnh tiêu biểu',
        'Thực hành tại lớp học',
      ],
      'buổi 4': [
        'Phân tích và nắm bắt tâm lý con người qua ngôn ngữ hình thể',
        'Phân tích tướng đi và tướng ngồi',
        'Phân tích các biểu hiện tay chân',
        'Thực hành phân tích clip để đọc suy nghĩ của nhân vật',
        'Kiểm tra cuối kỳ, cấp giấy chứng nhận, bảng điểm do HRC cấp',
      ],
    },
    materials: {
      mandatory:
        'Nguyễn Thanh Vân, Tài liệu nhân tướng học ứng dụng, 2019, VNHURS edition (do HRC soạn thảo, cung cấp miễn phí)',
      references:
        'Tài liệu do giảng viên phụ trách cung cấp, đã qua kiểm định chất lượng của HRC',
      software: 'Google, Internet, PowerPoint',
    },
    instructors: [
      'Nguyễn Thanh Vân, MBA, 15 năm kinh nghiệm giảng dạy ngành Quản trị nhân sự',
    ],
  },
];

export const seedCourses = async (prisma: PrismaClient) => {
  console.log('--- SEEDING COURSES ---');

  // BƯỚC 1: LẤY ID CỦA ADMIN ĐỂ GÁN LÀM NGƯỜI TẠO (CREATOR)
  // Giả sử lấy user superadmin vừa tạo ở bước trước
  const adminUser = await prisma.user.findFirst({
    where: { username: 'superadmin' }, // Hoặc email: 'super.admin@yourdomain.com'
  });

  if (!adminUser) {
    throw new Error('Không tìm thấy Admin User để gán quyền tạo khóa học. Hãy chạy seed account trước.');
  }

  await Promise.all(
    rawCourses.map(async (courseData) => {
      // LOGIC TRANSFORM: Chuyển đổi Contents từ Object -> Array
      let transformedContents: any = courseData.contents;
      
      // @ts-ignore
      if (!Array.isArray(courseData.contents) && typeof courseData.contents === 'object') {
         // @ts-ignore
        transformedContents = Object.keys(courseData.contents).map((key) => ({
          title: key,
           // @ts-ignore
          topics: courseData.contents[key],
        }));
      }

      // BƯỚC 2: TẠO SLUG
      const slug = stringToSlug(courseData.name);

      // BƯỚC 3: CẬP NHẬT PAYLOAD ĐẦY ĐỦ
      // Lưu ý: Dùng createPayload riêng và updatePayload riêng nếu cần
      // Nhưng với upsert đơn giản, ta dùng chung object
      const coursePayload = {
        name: courseData.name,
        code: courseData.code,
        // --- THÊM TRƯỜNG SLUG ---
        slug: slug, 
        
        objectives: courseData.objectives,
        audiences: courseData.audiences,
        requirements: courseData.requirements,
        duration: courseData.duration,
        schedule: courseData.schedule,
        locations: courseData.locations,
        instructors: courseData.instructors,
        
        assessment: courseData.assessment,
        materials: courseData.materials,
        contents: transformedContents,

        // --- THÊM TRƯỜNG CREATOR (QUAN HỆ) ---
        // Sử dụng 'connect' để liên kết với User đã có
        creator: {
            connect: { id: adminUser.id }
        }
      };

      await prisma.course.upsert({
        where: { code: courseData.code },
        update: coursePayload,
        create: coursePayload,
      });

      console.log(`\t[✔] Course '${courseData.code}' seeded (Slug: ${slug}).`);
    }),
  );
};