import * as fs from 'fs';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const TEMPLATE_PATH = path.join(__dirname, 'response-templates.json');

export interface ConsultationVariant {
  id: string;
  name: string;
  header: string;
  footer: string;
  empty: string;

  course_header: string;
  summary_template?: string;

  // [FIX LỖI] Thêm dòng này vào để TypeScript nhận diện bảng dịch
  intent_map?: Record<string, string>;

  field_dictionary: Record<
    string,
    {
      label: string;
      is_list: boolean;
      bullet?: string;
      suffix?: string;
      sub_bullet?: string;
      key_map?: Record<string, string>;
    }
  >;
}

export interface BookingVariant {
  id: string;
  name: string;
  // Các câu hỏi bắt buộc (theo logic cũ của bạn)
  ask_fullname: string;
  ask_contact: string; // Hỏi chung khi thiếu cả 2
  ask_time: string;
  ask_method: string;
  ask_destination: string; // Hỏi chung địa điểm/nền tảng
  confirmation: string;

  // Các câu hỏi mở rộng (Tùy chọn - Advanced)
  ask_email?: string; // Hỏi riêng Email (nếu đã có Phone)
  ask_phone?: string; // Hỏi riêng Phone (nếu đã có Email)
}

@Injectable()
export class ResponseFormatter {
  private templates: {
    consultation: ConsultationVariant[];
    booking: BookingVariant[];
  };
  private templatePath: string;

  constructor() {
    this.resolvePath();
    this.loadTemplates();
  }

  // =========================================================
  // PHẦN 1: LOAD & SAVE
  // =========================================================
  private resolvePath() {
    const rootDir = process.cwd(); // Thư mục gốc dự án (nơi có package.json)

    // Ưu tiên 1: Đọc từ src (Khi đang Dev) để update nóng
    const srcPath = path.join(
      rootDir,
      'src',
      'utils',
      'response-templates.json',
    );

    // Ưu tiên 2: Đọc từ dist (Khi đã Build/Prod)
    const distPath = path.join(
      rootDir,
      'dist',
      'utils',
      'response-templates.json',
    );

    // Logic kiểm tra
    if (fs.existsSync(srcPath)) {
      this.templatePath = srcPath;
      console.log('📂 [Formatter] Đang sử dụng file mẫu tại SRC:', srcPath);
    } else {
      this.templatePath = distPath;
      console.log('📂 [Formatter] Đang sử dụng file mẫu tại DIST:', distPath);
    }
  }
  private loadTemplates() {
    try {
      if (fs.existsSync(this.templatePath)) {
        const rawData = fs.readFileSync(this.templatePath, 'utf-8');
        this.templates = JSON.parse(rawData);

        // Check nhanh
        if (
          !this.templates.consultation ||
          this.templates.consultation.length === 0
        ) {
          console.error(
            '⚠️ [CẢNH BÁO] File JSON tồn tại nhưng mảng consultation RỖNG!',
          );
        } else {
          console.log(
            `✅ [Formatter] Đã load ${this.templates.consultation.length} mẫu tư vấn.`,
          );
        }
      } else {
        // NẾU KHÔNG TÌM THẤY FILE -> BÁO LỖI CHỨ KHÔNG TẠO MỚI LINH TINH NỮA
        console.error(
          `❌ [CRITICAL] Không tìm thấy file JSON tại: ${this.templatePath}`,
        );
        console.error(
          '👉 Vui lòng kiểm tra lại thư mục src/utils/ và chắc chắn file tồn tại.',
        );

        // Fallback tạm thời trong RAM để server không crash
        this.templates = { consultation: [], booking: [] };
      }
    } catch (error) {
      console.error('❌ [ERROR] Lỗi đọc file JSON:', error.message);
      this.templates = { consultation: [], booking: [] };
    }
  }

  private saveTemplates() {
    fs.writeFileSync(
      TEMPLATE_PATH,
      JSON.stringify(this.templates, null, 2),
      'utf-8',
    );
  }

  // =========================================================
  // PHẦN 2: CRUD OPERATIONS (FIXED TYPE ERROR)
  // =========================================================

  /**
   * Thêm một bộ mẫu mới vào danh sách
   */
  public addVariant(category: 'consultation' | 'booking', data: any) {
    const newVariant = { ...data, id: uuidv4() };

    // [FIX]: Ép kiểu về mảng any để TypeScript không báo lỗi union type
    (this.templates[category] as any[]).push(newVariant);

    this.saveTemplates();
    return newVariant;
  }

  /**
   * Chỉnh sửa một bộ mẫu dựa trên ID
   */
  public updateVariant(
    category: 'consultation' | 'booking',
    id: string,
    updates: any,
  ) {
    // [FIX]: Ép kiểu về mảng any
    const list = this.templates[category] as any[];
    const index = list.findIndex((item) => item.id === id);

    if (index === -1)
      throw new Error(`Template ID ${id} not found in ${category}`);

    // Merge dữ liệu cũ và mới
    list[index] = { ...list[index], ...updates };

    this.saveTemplates();
    return list[index];
  }

  /**
   * Xóa một bộ mẫu
   */
  public deleteVariant(category: 'consultation' | 'booking', id: string) {
    // [FIX]: Ép kiểu để filter
    let list = this.templates[category] as any[];
    const initialLength = list.length;

    list = list.filter((item) => item.id !== id);

    // Gán ngược lại vào templates (cần ép kiểu hoặc gán từng cái nếu muốn strict)
    if (category === 'consultation') {
      this.templates.consultation = list;
    } else {
      this.templates.booking = list;
    }

    if (list.length === initialLength) {
      throw new Error(`Template ID ${id} not found`);
    }

    this.saveTemplates();
    return { success: true, message: `Deleted variant ${id}` };
  }

  public getAllVariants() {
    return this.templates;
  }

  // =========================================================
  // PHẦN 3: RANDOMIZER & FORMATTER
  // =========================================================

  /**
   * Lấy ngẫu nhiên một biến thể trong danh mục
   * [FIX]: Thêm Generics <T> để tái sử dụng
   */
  private getRandomVariant<T>(category: 'consultation' | 'booking'): T {
    // [FIX]: Ép kiểu về mảng any để lấy length và index
    const list = this.templates[category] as any[];

    if (!list || list.length === 0) {
      // Fallback: Trả về object rỗng hoặc throw error tùy bạn
      // Ở đây throw error để dễ debug
      throw new Error(
        `No templates found for category ${category}. Please add one via API.`,
      );
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex] as T;
  }

  /**
   * FORMAT TƯ VẤN (Random Style)
   */
  // Trong file src/utils/response-formatter.util.ts

  public formatConsultationResponse(dataList: any[]): string {
    try {
      const tpl = this.getRandomVariant<ConsultationVariant>('consultation');

      if (!dataList || dataList.length === 0) return tpl.empty;

      const groupedByCourse = this.groupBy(dataList, 'courseCode');
      const courseCodes = Object.keys(groupedByCourse);

      // Kiểm tra: Có phải hỏi chung (không có field cụ thể) không?
      const isGeneralInquiry = dataList.every((i) => !i.field);

      // ------------------------------------------------------------------
      // [LOGIC MỚI] XỬ LÝ DANH SÁCH DÀI (> 5 khóa) -> HIỆN LIST RÚT GỌN
      // ------------------------------------------------------------------
      if (courseCodes.length > 5 && isGeneralInquiry) {
        // 1. Lấy câu mở đầu (VD: "Tìm thấy 20 khóa học...")
        let listResponse = tpl.summary_template
          ? tpl.summary_template.replace(
              '{count}',
              courseCodes.length.toString(),
            )
          : `Hệ thống tìm thấy ${courseCodes.length} khóa học:`;

        listResponse += '\n'; // Xuống dòng bắt đầu list

        // 2. Loop qua từng khóa để tạo dòng rút gọn: "- Tên Khóa (Mã)"
        for (const [code, items] of Object.entries(groupedByCourse)) {
          const itemArray = items as any[];
          // Lấy tên khóa từ phần tử đầu tiên
          const name = itemArray[0].courseName || 'Khóa học';

          // Format dòng rút gọn (Bạn có thể đưa format này vào JSON nếu muốn)
          listResponse += `\n🔹 ${name} (${code})`;
        }

        // 3. Cộng footer và trả về luôn (Không chạy xuống logic chi tiết bên dưới nữa)
        listResponse += tpl.footer;
        return listResponse;
      }
      // ------------------------------------------------------------------

      let response = tpl.header;

      // 4. LOGIC CHI TIẾT (Cho trường hợp < 5 khóa hoặc có hỏi field cụ thể)
      for (const [code, items] of Object.entries(groupedByCourse)) {
        const itemArray = items as any[];
        const courseName = itemArray[0].courseName || code;

        let headerStr = tpl.course_header || `\n\n📌 {code}`;
        headerStr = headerStr
          .replace('{code}', code)
          .replace('{name}', courseName);

        response += headerStr;

        itemArray.forEach((item) => {
          if (item.field) {
            response += this.formatField(
              item.field,
              item.value,
              tpl.field_dictionary,
            );
          }
        });
      }

      response += tpl.footer;
      return response;
    } catch (e) {
      console.error('Lỗi format consultation:', e);
      return 'Xin lỗi, hệ thống đang gặp lỗi hiển thị.';
    }
  }

  /**
   * Helper format field
   */
  private formatField(fieldKey: string, rawValue: any, dict: any): string {
    // Lấy config, nếu không có thì fallback về mặc định
    const config = dict[fieldKey] || { label: fieldKey, is_list: false };
    const label = config.label;

    // Config mặc định cho các ký tự trang trí
    const bullet = config.bullet || '👉 ';
    const subBullet = config.sub_bullet || '- ';

    // CASE 1: Dữ liệu là Array đơn giản
    if (Array.isArray(rawValue)) {
      if (rawValue.length === 0) return `\n${bullet}${label}: (Đang cập nhật)`;
      const listStr = rawValue
        .map((item) => `\n   ${config.bullet || '- '}${item}`)
        .join('');
      return `\n${bullet}${label}:${listStr}`;
    }

    // CASE 2: Dữ liệu là Object (contents, assessment, materials)
    if (typeof rawValue === 'object' && rawValue !== null) {
      // 2.1 Đặc biệt cho "contents" (Key là buổi học, không cần dịch)
      if (fieldKey === 'contents') {
        let contentStr = '';
        for (const [session, topics] of Object.entries(rawValue)) {
          // session key (buổi 1, buổi 2...) thường giữ nguyên hoặc uppercase
          contentStr += `\n   📌 ${session.toUpperCase()}:`;
          if (Array.isArray(topics)) {
            topics.forEach((t) => (contentStr += `\n      ${subBullet}${t}`));
          } else {
            contentStr += ` ${topics}`;
          }
        }
        return `\n${bullet}${label}:${contentStr}`;
      }

      // 2.2 Các Object key-value cần dịch (materials, assessment)
      const listStr = Object.entries(rawValue)
        .map(([k, v]) => {
          // [LOGIC MỚI] Lấy từ điển dịch từ JSON
          // Nếu không có trong key_map, dùng key gốc
          const translatedKey =
            config.key_map && config.key_map[k] ? config.key_map[k] : k;
          return `\n   🔹 ${translatedKey}: ${v}`;
        })
        .join('');

      return `\n${bullet}${label}:${listStr}`;
    }

    // CASE 3: Dữ liệu đơn giản
    let finalValue = rawValue;
    if (config.suffix) finalValue += config.suffix;
    return `\n${bullet}${label}: ${finalValue}`;
  }

  /**
   * FORMAT ĐẶT LỊCH (Random Style)
   */
  public formatBookingQuestion(state: any): string {
    try {
      // 1. Lấy mẫu ngẫu nhiên
      const tpl = this.getRandomVariant<BookingVariant>('booking');

      // --- BƯỚC 1: HỎI TÊN ---
      if (!state.fullname) {
        return tpl.ask_fullname;
      }

      // --- BƯỚC 2: HỎI LIÊN HỆ (Phone/Email) ---

      // Trường hợp thiếu cả hai (Giống logic cũ: !phone && !email)
      if (!state.phone && !state.email) {
        return tpl.ask_contact.replace('{fullname}', state.fullname);
      }

      // [Mở rộng] Có Phone rồi nhưng thiếu Email (Nếu template hỗ trợ hỏi riêng)
      if (state.phone && !state.email && tpl.ask_email) {
        return tpl.ask_email.replace('{fullname}', state.fullname);
      }

      // [Mở rộng] Có Email rồi nhưng thiếu Phone (Nếu template hỗ trợ hỏi riêng)
      if (state.email && !state.phone && tpl.ask_phone) {
        return tpl.ask_phone.replace('{fullname}', state.fullname);
      }

      // --- BƯỚC 3: HỎI THỜI GIAN ---
      if (!state.time) {
        return tpl.ask_time;
      }

      // --- BƯỚC 4: HỎI HÌNH THỨC (Method) ---
      if (!state.method) {
        return tpl.ask_method;
      }

      // --- BƯỚC 5: HỎI ĐỊA ĐIỂM (Destination) ---
      if (!state.destination || state.destination.trim() == 'null') {
        // Logic thông minh: Nếu template có câu hỏi riêng cho Online/Offline thì dùng
        const method = state.method.toLowerCase();
        // Fallback: Dùng câu hỏi chung (Giống logic cũ)
        return tpl.ask_destination;
      }

      // --- BƯỚC 6: CHỐT ĐƠN (Confirmation) ---
      let confirmMsg = tpl.confirmation;

      // Hàm helper để tránh lỗi null khi replace
      const val = (v: any) => (v ? v : '...');

      confirmMsg = confirmMsg
        .replace(/{fullname}/g, val(state.fullname)) // Dùng Regex /g để replace tất cả nếu xuất hiện nhiều lần
        .replace(/{method}/g, val(state.method))
        .replace(/{time}/g, val(state.time))
        .replace(/{destination}/g, val(state.destination))
        .replace(/{id}/g, val(state.id));

      return confirmMsg;
    } catch (e) {
      console.error('Lỗi format booking:', e);
      // Fallback an toàn nếu file JSON lỗi
      return 'Bạn muốn đặt lịch vào thời gian nào?';
    }
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((result, currentValue) => {
      (result[currentValue[key]] = result[currentValue[key]] || []).push(
        currentValue,
      );
      return result;
    }, {});
  }
}
