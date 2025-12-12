import ollama
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import contextlib

# --- CẤU HÌNH BAN ĐẦU (Giữ nguyên) ---
JSON_KEY_MAP = {
    "tên": "name",
    "mã": "code",
    "mục tiêu": "objectives",
    "đối tượng học": "audiences",
    "yêu cầu": "requirements",
    "tài liệu": "materials",
    "thời lượng": "duration",
    "học phí": "tuition",
}
INFO_TYPES = list(JSON_KEY_MAP.keys())
MODEL = 'llama3.2'
# Lấy thư mục của file Python hiện tại
# __file__ là đường dẫn tuyệt đối đến script đang chạy
BASE_DIR = Path(__file__).resolve().parent

# Nối thư mục hiện tại với 'data' và 'courses_data_v1.json'
FILE_PATH = BASE_DIR / "data" / "courses_data_v1.json"



# Biến toàn cục để lưu trữ dữ liệu và system prompt
COURSE_DATA: List[Dict[str, Any]] = []
SYSTEM_PROMPT: str = ""

# Pydantic model cho request body
class Query(BaseModel):
    question: str
    
# --- LOGIC XỬ LÝ (Sử dụng lại và tối ưu hóa) ---

def load_course_data(file_path: str) -> Optional[List[Dict[str, Any]]]:
    """Đọc dữ liệu khóa học từ tệp JSON."""
    try:
        if not os.path.exists(os.path.dirname(file_path)):
            os.makedirs(os.path.dirname(file_path))
        if not os.path.exists(file_path):
            print(f"⚠️ Tạo tệp rỗng tại {file_path}. Vui lòng điền dữ liệu.")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('[]')
            return []
            
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Lỗi khi tải dữ liệu: {e}")
        return None

def generate_system_prompt(data: List[Dict[str, Any]]) -> str:
    """Tạo System Prompt động, ràng buộc cú pháp chặt chẽ."""
    course_list_str = ""
    valid_codes = []

    for course in data:
        code = course.get('ma', 'XXX').strip()
        name = course.get('ten', 'Không rõ').strip()
        course_list_str += f"'{name}' (Mã: {code}); "
        valid_codes.append(code)

    valid_codes_str = ", ".join([f"'{c}'" for c in valid_codes])
    info_types_str = ", ".join([f"'{t}'" for t in INFO_TYPES])
    
    # Giữ nguyên prompt của bạn để đảm bảo tính nhất quán với Ollama
    prompt = f"""
    Bạn là một trợ lý thông minh chuyên về thông tin khóa học và chuyên gia mã hóa lại câu trả lời sang định dạng JSON.

    Đây là danh sách các khóa học tôi cung cấp: {course_list_str.strip()}
    Danh sách các Mã Khóa Học Hợp Lệ (được gọi là [mã khóa học]) là: {valid_codes_str}
    Danh sách các Loại Thông Tin Hợp Lệ (được gọi là [thông tin]) là: {INFO_TYPES}

    Bạn phải tuân thủ nghiêm ngặt các quy tắc sau:

    1. Nếu người dùng muốn hỏi về TẤT CẢ các khóa học trong danh sách (Ví dụ: "Bạn có những khóa học nào?", "Liệt kê tất cả khóa học"):
        Logic: Trả về tất cả các mã khóa học hợp lệ với trường "target" là `null`.
        Định dạng JSON:
        ```
        [
            {{
                "target": null,
                "course": "HRC-P0"
            }},
            {{
                "target": null,
                "course": "HRC-RS01"
            }},
            // ... (các khóa học khác)
        ]
        ```

    2. Nếu người dùng hỏi các khóa học có mã không nằm trong danh sách mã khóa học hợp lệ hoặc câu hỏi không liên quan/không rõ ràng:
        Logic: Không thể xác định thông tin hoặc khóa học hợp lệ.
        Định dạng JSON:
        ```
        [
            {{
                "target": null,
                "course": null
            }}
        ]
        ```

    3. Nếu người dùng hỏi thông tin liên quan đến các khóa học CÓ trong danh sách:
        Logic:
        - Bạn phải xác định đúng LOẠI thông tin người dùng muốn (thuộc 1 trong các từ khóa: {INFO_TYPES}). Loại thông tin này sẽ là giá trị cho trường "target".
        - Bạn phải xác định đúng MÃ KHÓA HỌC hợp lệ. Mã khóa học phải là mã duy nhất và hợp lệ nằm trong danh sách ({valid_codes_str}). Mã này sẽ là giá trị cho trường "course".
        - Nếu câu hỏi đề cập đến nhiều loại thông tin và/hoặc nhiều khóa học, bạn phải tạo nhiều đối tượng trong mảng JSON tương ứng.
        Định dạng JSON (Công thức DUY NHẤT): Một mảng các đối tượng JSON, mỗi đối tượng là một cặp (target, course) hợp lệ.
        ```
        [
            {{
                "target": "[loại thông tin hợp lệ]",
                "course": "[mã khóa học hợp lệ]"
            }}
            //,... (Thêm các đối tượng nếu có nhiều yêu cầu/khóa học)
        ]
        ```
         Ví dụ (Nếu người dùng hỏi: "Yêu cầu và thời lượng của khóa HRC-P0 là gì?"):
        ```
        [
            {{
                "target": "yêu cầu",
                "course": "HRC-P0"
            }},
            {{
                "target": "thời lượng",
                "course": "HRC-P0"
            }}
        ]
        ```
    Ví dụ không hợp lệ:
    - Không tồn "target" != null mà "course" == null (phải trả về cả 2 null)
    ```
    [
        {{
            "target": "yêu cầu",
            "course": null
        }},
        {{
            "target": "thời lượng",
            "course": null
        }}
    ]
    ```
    - Danh sách các khóa học bạn cung cấp không có thông tin về [tên khóa]. Bạn phải trả về một mảng JSON với trường "target" là `null` và trường "course" là mã khóa học hợp lệ, nhưng không có mã nào liên quan đến khóa lập trình căn bản.

    Yêu cầu đầu ra bắt buộc:
    - CHỈ trả về khối JSON.
    - Tuyệt đối KHÔNG thêm bất kỳ lời giải thích, văn bản, dấu câu, lưu ý hoặc ký tự nào khác ngoài định dạng JSON đã quy định.
    - Tuyệt đối KHÔNG giải thích thêm bất kỳ thông tin nào, chỉ trả về chuỗi JSON theo logic đã quy định.
    - Các khóa học trong mảng phải là mã hợp lệ từ `{valid_codes_str}`.
    - Các loại thông tin phải là từ khóa hợp lệ từ `{INFO_TYPES}`.
    """
    return prompt.strip().strip('```')

def clean_json_string(json_string: str) -> str:
    """Loại bỏ các ký tự bao quanh không mong muốn (như ```) khỏi chuỗi JSON."""
    cleaned_string = json_string.strip()
    return cleaned_string.strip('`').strip('json').strip() # Xử lý cả ```json và ```

def get_course_info(model: str, system_prompt: str, user_query: str) -> str:
    """Gọi Ollama API với System Prompt đã định."""
    print(f"Đang gửi truy vấn tới mô hình {model}...")
    try:
        response = ollama.generate(
            model=model,
            prompt=user_query,
            system=system_prompt,
            # Giảm tính ngẫu nhiên (temperature=0.0) để buộc mô hình tuân thủ công thức
            options={
                'temperature': 0.0, 
                'num_ctx': 4096 # Đảm bảo context window đủ lớn
            }
        )
        print(response['response'])
        return response['response'].strip()
    except ollama.ResponseError as e:
        return f"❌ Lỗi phản hồi Ollama: Vui lòng kiểm tra xem mô hình '{model}' đã được pull chưa. Chi tiết: {e}"
    except Exception as e:
        return f"❌ Lỗi kết nối Ollama: {e}"

def process_structured_response(structured_response: str, course_data: List[Dict[str, Any]]) -> str:
    """
    Phân tích phản hồi JSON từ mô hình và tra cứu dữ liệu chi tiết,
    sau đó định dạng thành câu trả lời tự nhiên.
    """
    cleaned_json_string = clean_json_string(structured_response)

    try:
        # 1. Tải JSON từ chuỗi phản hồi
        response_list: List[Dict[str, Any]] = json.loads(cleaned_json_string)
        
        # Kiểm tra trường hợp đặc biệt: [null]-[null]
        if response_list == [{'target': None, 'course': None}]:
            return "❌ Tôi xin lỗi, tôi không thể xác định được khóa học hoặc thông tin hợp lệ từ câu hỏi của bạn. Vui lòng hỏi rõ hơn về mã khóa học hoặc thông tin cụ thể (ví dụ: 'yêu cầu', 'mục tiêu')."
            
        final_answer_parts = []
        
        # 2. Lặp qua các cặp (target, course)
        for item in response_list:
            info_type_vi = item.get('target')
            course_code = item.get('course')
            
            # Xử lý trường hợp [null]-[all] (Chỉ liệt kê tên khóa học)
            if info_type_vi is None and course_code is not None:
                # Đây là trường hợp liệt kê TẤT CẢ các khóa học
                all_courses = [f"{c['name']} (Mã: {c['code']})" for c in course_data if c.get('name') and c.get('code')]
                if all_courses:
                    return "✅ Hiện tại chúng tôi có các khóa học sau:\n- " + "\n- ".join(all_courses)
                else:
                    return "⚠️ Hiện tại không có dữ liệu khóa học nào."

            # Xử lý trường hợp thông thường: [info]-[code]
            if info_type_vi and course_code:
                # Tìm khóa học trong dữ liệu JSON
                found_course = next((c for c in course_data if c.get('code') == course_code), None)

                if found_course:
                    actual_key = JSON_KEY_MAP.get(info_type_vi)
                    course_name = found_course.get('name', course_code)

                    if actual_key and actual_key in found_course:
                        detail = found_course[actual_key]
                        
                        # Định dạng nội dung chi tiết
                        if isinstance(detail, list):
                            detail_str = "\n    - " + "\n    - ".join([str(item) for item in detail])
                        elif isinstance(detail, dict):
                            # Xử lý nội dung (contents)
                            if actual_key == 'contents':
                                content_list = []
                                for session, topics in detail.items():
                                    content_list.append(f"  - **{session.capitalize()}**:")
                                    content_list.append("    + " + "\n    + ".join(topics))
                                detail_str = "\n" + "\n".join(content_list)
                            # Xử lý đánh giá (assessment)
                            elif actual_key == 'assessment':
                                detail_str = "\n" + "\n".join([f"  - **{k.replace('_', ' ').capitalize()}**: {v}" for k, v in detail.items()])
                            else:
                                detail_str = str(detail)
                        else:
                            # String/Number (ví dụ: tài liệu, thời lượng)
                            detail_str = str(detail)
                        
                        final_answer_parts.append(f"**{info_type_vi.capitalize()}** của khóa học **{course_name} ({course_code})** là: {detail_str}")
                    else:
                        final_answer_parts.append(f"⚠️ Thông tin '{info_type_vi}' (Key: '{actual_key}') không có sẵn cho khóa học **{course_name} ({course_code})**.")
                else:
                    final_answer_parts.append(f"⚠️ Khóa học có mã **{course_code}** không tồn tại trong dữ liệu.")
            
        if final_answer_parts:
            return "✅ " + "\n\n".join(final_answer_parts)
        else:
            return "❌ Tôi không thể tìm thấy bất kỳ thông tin hợp lệ nào theo yêu cầu của bạn."

    except json.JSONDecodeError:
        return f"❌ Phản hồi từ mô hình không phải là JSON hợp lệ. Đầu ra thô: {structured_response}"
    except Exception as e:
        return f"❌ Lỗi xử lý dữ liệu: {e}. Đầu ra thô: {structured_response}"

# --- FASTAPI ENDPOINT ---

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Bộ xử lý sự kiện vòng đời (Lifespan handler) cho FastAPI,
    thay thế cho on_event("startup").
    """
    global COURSE_DATA, SYSTEM_PROMPT
    
    print("🚀 Đang tải dữ liệu khóa học...")
    COURSE_DATA = load_course_data(FILE_PATH)
    
    if not COURSE_DATA:
        print("🔴 KHÔNG THỂ KHỞI TẠO CHATBOT: Dữ liệu khóa học rỗng hoặc lỗi.")
        # Không cần return, chỉ cảnh báo

    SYSTEM_PROMPT = generate_system_prompt(COURSE_DATA)
    print("✅ System Prompt đã được tạo và Chatbot sẵn sàng.")
    print("-" * 50)

    # Logic chạy trong startup đã hoàn tất.
    # Yield để cho phép ứng dụng xử lý các request
    yield
    
    # Logic shutdown (nếu cần dọn dẹp tài nguyên) sẽ được đặt ở đây.
    print("👋 Shutting down the API...")

# --- KHỞI TẠO APP VÀ DỮ LIỆU ---
app = FastAPI(
    title="Ollama Course Info Chatbot API",
    description="API trích xuất thông tin khóa học bằng Ollama và FastAPI.",
    lifespan=lifespan
)

@app.get("/")
def read_root():
    """Endpoint kiểm tra sức khỏe API."""
    return {"status": "ok", "message": "Ollama Chatbot API đã sẵn sàng. Dùng endpoint /query để tương tác."}


@app.post("/query")
async def process_query(query: Query):
    """
    Endpoint chính để xử lý câu hỏi của người dùng và trả về câu trả lời tự nhiên.
    """
    global COURSE_DATA, SYSTEM_PROMPT
    if not COURSE_DATA:
         return {"answer": "🔴 Lỗi hệ thống: Dữ liệu khóa học chưa được tải hoặc bị lỗi. Vui lòng kiểm tra file data.", "raw_response": None}

    user_question = query.question
    
    # 1. Gọi mô hình Ollama để lấy phản hồi CÓ CẤU TRÚC (JSON)
    structured_response = get_course_info(MODEL, SYSTEM_PROMPT, user_question)
    
    # Kiểm tra lỗi kết nối/hệ thống
    if structured_response.startswith('{"error":'):
        return json.loads(structured_response)

    # 2. Xử lý phản hồi có cấu trúc để tạo câu trả lời tự nhiên
    final_response = process_structured_response(structured_response, COURSE_DATA)
    
    return {
        "question": user_question,
        "answer": final_response,
        "raw_response_from_ollama": structured_response
    }


# uvicorn api_chatbot:app --reload