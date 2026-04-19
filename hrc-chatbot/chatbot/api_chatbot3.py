import ollama
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
from datetime import datetime
from zoneinfo import ZoneInfo

# --- 1. CẤU HÌNH & DATA MODEL ---
MODEL = 'llama3.2'
BASE_DIR = Path(__file__).resolve().parent
FILE_PATH = BASE_DIR / "data" / "courses_data_v1.json"

# Biến toàn cục lưu dữ liệu khóa học
COURSE_DATA: List[Dict[str, Any]] = []
COURSE_SYSTEM_PROMPT: str = ""

# Định nghĩa các trường thông tin cho khóa học (Logic cũ)
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

# --- 2. CÁC CLASS INPUT/OUTPUT ---

class ChatRequest(BaseModel):
    question: str
    # State hiện tại của việc đặt lịch (nếu client đang lưu), mặc định là rỗng
    booking_state: Optional[Dict[str, Any]] = None

class StandardResponse(BaseModel):
    target: Optional[str] # "tư vấn", "đặt lịch", hoặc null
    data: Any             # Có thể là chuỗi trả lời (tư vấn) hoặc Dict (đặt lịch)

# --- 3. LOGIC HỆ THỐNG & PROMPTS ---

def load_course_data():
    """Tải dữ liệu khóa học khi khởi động app"""
    print(FILE_PATH)
    try:
        if not os.path.exists(os.path.dirname(FILE_PATH)):
            os.makedirs(os.path.dirname(FILE_PATH))
        if not os.path.exists(FILE_PATH):
            with open(FILE_PATH, 'w', encoding='utf-8') as f: f.write('[]')
            return []
        with open(FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Lỗi tải data: {e}")
        return []

def generate_course_system_prompt(data):
    """Tạo prompt cho bot Tư vấn (Component 1)"""
    course_list_str = ""
    valid_codes = []

    for course in data:
        code = course.get('code', 'XXX').strip()
        name = course.get('name', 'Không rõ').strip()
        course_list_str += f"'{name}' (Mã: {code}); "
        valid_codes.append(code)

    valid_codes_str = ", ".join([f"'{c}'" for c in valid_codes])
    info_types_str = ", ".join([f"'{t}'" for t in INFO_TYPES])
    
    # Giữ nguyên prompt của bạn để đảm bảo tính nhất quán với Ollama
    prompt = f"""
    Bạn là một chuyên gia mã hóa lại câu trả lời sang định dạng JSON.

    Đây là danh sách các khóa học tôi cung cấp: {course_list_str.strip()}
    Danh sách các Mã Khóa Học Hợp Lệ (được gọi là [mã khóa học]) là: {valid_codes_str}
    Danh sách các Loại Thông Tin Hợp Lệ (được gọi là [thông tin]) là: {INFO_TYPES}

    Bạn phải tuân thủ nghiêm ngặt các quy tắc sau:
    1. Nếu người dùng muốn hỏi về TẤT CẢ các khóa học trong danh sách (Ví dụ: "Bạn có những khóa học nào?", "Liệt kê tất cả khóa học"):
        Logic: Trả về tất cả các mã khóa học hợp lệ với trường "target" là `null`.
        Định dạng JSON:
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

    2. Nếu người dùng hỏi các khóa học có mã không nằm trong danh sách mã khóa học hợp lệ hoặc câu hỏi không liên quan/không rõ ràng:
        Logic: Không thể xác định thông tin hoặc khóa học hợp lệ.
        Định dạng JSON:
        [
            {{
                "target": null,
                "course": null
            }}
        ]

    3. Nếu người dùng hỏi thông tin liên quan đến các khóa học CÓ trong danh sách:
        Logic:
        - Bạn phải xác định đúng LOẠI thông tin người dùng muốn (bắt buộc thuộc 1 trong các từ khóa: {INFO_TYPES}). Loại thông tin này sẽ là giá trị cho trường "target".
        - Bạn phải xác định đúng MÃ KHÓA HỌC hợp lệ. Mã khóa học phải là mã duy nhất và hợp lệ nằm trong danh sách ({valid_codes_str}). Mã này sẽ là giá trị cho trường "course".
        - Nếu câu hỏi đề cập đến nhiều loại thông tin và/hoặc nhiều khóa học, bạn phải tạo nhiều đối tượng trong mảng JSON tương ứng.
        Định dạng JSON (Công thức DUY NHẤT): Một mảng các đối tượng JSON, mỗi đối tượng là một cặp (target, course) hợp lệ.
        [
            {{
                "target": "[loại thông tin hợp lệ]",
                "course": "[mã khóa học hợp lệ]"
            }}
            //,... (Thêm các đối tượng nếu có nhiều yêu cầu/khóa học)
        ]
         Ví dụ (Nếu người dùng hỏi: "Yêu cầu và thời lượng của khóa HRC-P0 là gì?"):
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

def get_router_prompt():
    """Prompt phân loại ý định (Component 2)"""
    return """
        Bạn là một trợ lý AI với góc nhìn sâu sắc, có thể nhận biết và hiểu rõ yêu cầu của vấn đề. 
        Hãy phân biệt và trả về JSON nhu cầu của khách hàng, chỉ bao gồm "đặt lịch" và "tư vấn".
        Yêu cầu trả về:
        1. Nếu người dùng có nhu cầu tư vấn, hoặc hỏi thông tin về một hay nhiều khóa học, trả về {{"target":"tư vấn"}}
        2. Nếu người dùng có nhu cầu đặt lịch tư vấn với nhân viên, trả về {{"target":"đặt lịch"}}
        3. Nếu không xác định được nhu cầu của người dùng (không thuộc danh sách trên) thì trả về {{"target":null}}
        Yêu cầu đầu ra bắt buộc:
            - CHỈ trả về khối JSON.
            - Tuyệt đối KHÔNG thêm bất kỳ lời giải thích, văn bản, dấu câu, lưu ý hoặc ký tự nào khác ngoài định dạng JSON đã quy định.
            - Tuyệt đối KHÔNG giải thích thêm bất kỳ thông tin nào, chỉ trả về chuỗi JSON theo logic đã quy định.
            - Yêu cầu phải là "tư vấn" hoặc "đặt lịch"
        """

def get_booking_prompt(current_time_str):
    return f"""
        Bạn là một trợ lý AI và một chuyên gia ngôn ngữ chuyên hỗ trợ lấy thông tin để đặt lịch tư vấn khóa học cho khách hàng. 
        Bạn sẽ nhận đầu vào 2 thứ, 1 là 1 chuỗi json (nếu không có đồng nghĩa là yêu cầu mới hoàn toàn) về thông tin có từ trước, 2 là yêu cầu của người dùng.
        Hôm nay là ngày {current_time_str}, dùng nó để đối chiếu với mốc thời gian được yêu cầu
        Yêu cầu trả về:
        1. Trả về chuỗi JSON theo cầu trúc bên dưới:
        {{
            "fullname": "Họ và tên của khách hàng",
            "email": "Email của khách hàng",
            "phone": "Số điện thoại của khách hàng",
            "time": "Thời gian dự kiến hẹn, theo chuẩn ISO 8601, phải lớn hơn hiện tại ít nhất 1 tiếng, nếu không trả về null",
            "method": "Trực tiếp/gián tiếp",
            "destination": "địa chỉ thực tế nếu như là trực tiếp, đường link nền tảng gặp mặt (Ví dụ như Google Meet) nếu như là gặp online"
        }}
        2. Nếu có yêu cầu nào chưa xác định, trả về null với trường đó, ví dụ ở dưới là chưa xác định được bất kỳ yêu cầu nào:
        {{
            "fullname": null,
            "email": null,
            "phone": null,
            "time": null,
            "method": null,
            "destination": null
        }}
        Yêu cầu đầu ra bắt buộc:
            - CHỈ trả về khối JSON.
            - Tuyệt đối KHÔNG thêm bất kỳ lời giải thích, văn bản, dấu câu, lưu ý hoặc ký tự nào khác ngoài định dạng JSON đã quy định.
            - Tuyệt đối KHÔNG giải thích thêm bất kỳ thông tin nào, chỉ trả về chuỗi JSON theo logic đã quy định.
            - Nếu có trường (field) nào không được xác định, trả về giá trị null đối với field đó (ví dụ "fullname": null)
            - method bắt buộc là Trực tiếp/Gián tiếp/null
        """

# --- 4. HÀM XỬ LÝ (PROCESSING FUNCTIONS) ---

def call_ollama_json(model:str, system:str, user_query:str):
    """Hàm gọi Ollama trả về JSON"""
    print("UserQuery: "+user_query)
    try:
        response = ollama.generate(
            model=model,
            prompt=user_query,
            system=system,
            options={
                'temperature': 0.0, 
                'num_ctx': 8192, # Đảm bảo context window đủ lớn
                'seed': 6604,
                'top_k': 1,  # <--- THÊM DÒNG NÀY (Giới hạn sự lựa chọn từ vựng)
                'top_p': 0.1
            }
        )
        print("Response: "+response['response'])
        return json.loads(response['response'])
    except Exception as e:
        print(f"Ollama Error: {e}")
        return None

# --- XỬ LÝ TƯ VẤN (Logic Component 1) ---
def process_consultation(user_query):
    """
    Hàm này CHỈ gọi Ollama để lấy cấu trúc JSON [target, course].
    KHÔNG viết lại thành câu trả lời tự nhiên.
    """
    # Gọi hàm đã định nghĩa system prompt chuyên bóc tách khóa học
    # COURSE_SYSTEM_PROMPT cần đảm bảo trả về mảng JSON: [{"target": "...", "course": "..."}]
    raw_json_data = call_ollama_json(MODEL, COURSE_SYSTEM_PROMPT, user_query)
    # Trả về nguyên bản dữ liệu JSON (List hoặc Dict)
    # Nếu lỗi hoặc None, trả về list rỗng [] để phía Client dễ xử lý
    return raw_json_data if raw_json_data is not None else []

# --- XỬ LÝ ĐẶT LỊCH (Logic Component 3) ---
def process_booking(user_query, current_state):
    # 1. Lấy thời gian hiện tại
    now_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime("%Y-%m-%d %H:%M:%S")
    prompt = get_booking_prompt(now_str)
    
    # 2. Bóc tách thông tin mới
    extracted_data = call_ollama_json(MODEL, prompt, f"User said: {user_query}")
    
    if not extracted_data:
        return current_state # Giữ nguyên nếu lỗi
        
    # 3. Merge với state cũ (Logic Python)
    new_state = current_state.copy()
    for k, v in extracted_data.items():
        if v is not None:
            new_state[k] = v
            
    return new_state

# --- 5. FASTAPI LIFESPAN & ENDPOINTS ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    global COURSE_DATA, COURSE_SYSTEM_PROMPT
    print("🚀 Loading Course Data...")
    COURSE_DATA = load_course_data()
    COURSE_SYSTEM_PROMPT = generate_course_system_prompt(COURSE_DATA)
    print("✅ Ready.")
    yield
    print("👋 Shutting down.")

app = FastAPI(lifespan=lifespan)

@app.post("/chat", response_model=StandardResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Output:
    - Nếu là tư vấn: data = List[Dict] (Ví dụ: [{"target": "học phí", "course": "HRC-P0"}])
    - Nếu là đặt lịch: data = Dict (State đặt lịch)
    - Nếu null: data = String (Thông báo lỗi) hoặc Null
    """
    
    current_state = request.booking_state
    if current_state is None:
        current_state = {
            "fullname": None, "email": None, "phone": None,
            "time": None, "method": None, "destination": None
        }

    # BƯỚC 1: ROUTING
    router_res = call_ollama_json(MODEL, get_router_prompt(), request.question)
    target = router_res.get('target') if router_res else None
    
    print(f"🔍 Intent detected: {target}")

    # BƯỚC 2: BRANCHING
    final_data = None

    if target == 'tư vấn':
        final_data = process_consultation(request.question)
        
    elif target == 'đặt lịch':
        # Truyền current_state (đã được đảm bảo không null) vào
        final_data = process_booking(request.question, current_state)
        
    else:
        target = None
        final_data = None

    # BƯỚC 3: RESPONSE
    return {
        "target": target,
        "data": final_data
    }

# Chạy server: uvicorn api_chatbot2:app --reload