from ollama import chat
from ollama import ChatResponse
# Khai báo tên model LLM để sử dụng
# model_name = 'llama3.2'
# model_name = 'hf.co/phamhai/Llama-3.2-3B-Instruct-Frog-Q4_K_M-GGUF'
model_name = 'gpt-oss:20b'

# Khai báo thông tin cơ bản về một cuộc trò chuyện
# để gửi đến Ollama đã cài đặt trên máy tính thông qua API
response: ChatResponse = chat(model=model_name, messages=[
    {
        'role': 'user',
        'content': 'Chào bạn, bạn có thể cho tôi biết dự báo thời tiết ngày 25/09/2025 của TP.HCM không ?',
    },
])
# In ra câu trả lời từ Ollama ra màn hình
print(response['message']['content'])