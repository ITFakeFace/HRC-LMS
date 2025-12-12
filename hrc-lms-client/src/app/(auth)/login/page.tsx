"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Import từ source của bạn
import { AppDispatch, RootState } from "@/src/store/store"; // Đảm bảo đường dẫn đúng
import { loginUser } from "@/src/features/auth/authSlice";

// 1. Định nghĩa Validation Schema với Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email") // min(1) tương đương nonempty nhưng message rõ ràng hơn
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  rememberMe: z.boolean(),
});

// Tạo type TypeScript từ Schema
type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Lấy trạng thái loading/error từ Redux store
  const { status: authStatus, error: authError } = useSelector(
    (state: RootState) => state.auth
  );

  const isLoading = authStatus === "loading";

  // State cho UI Animation
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; delay: number }[]
  >([]);

  // 2. Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Setup Animation Particles
  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // 3. Xử lý Submit Form
  const onSubmit = async (data: LoginFormInputs) => {
    // Gọi Redux Thunk
    const resultAction = await dispatch(
      loginUser({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      })
    );

    if (loginUser.fulfilled.match(resultAction)) {
      // Đăng nhập thành công
      setShowSuccess(true);
      // Chờ animation xong rồi chuyển trang
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      // Đăng nhập thất bại (Lỗi từ Server trả về qua rejectWithValue)
      if (resultAction.payload) {
        // Nếu server trả về lỗi cụ thể, hiển thị ra form
        setError("root", {
          message:
            typeof resultAction.payload === "string"
              ? resultAction.payload
              : "Đăng nhập thất bại",
        });
      } else {
        setError("root", { message: "Có lỗi không xác định xảy ra." });
      }
    }
  };

  // Helper để register input nhưng vẫn giữ custom UI logic (onFocus/onBlur)
  const registerWithUI = (name: keyof LoginFormInputs) => {
    const { ref, onBlur, onChange, ...rest } = register(name);
    return {
      ...rest,
      onChange,
      ref,
      onFocus: () => setFocusedField(name),
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        onBlur(e); // Gọi hàm onBlur của RHF để trigger validation
        setFocusedField(""); // Reset UI focus state
      },
    };
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* === Background Animation === */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, #e42841 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #0d213c 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, #1a365d 0%, transparent 50%),
              linear-gradient(135deg, #0d213c 0%, #1a365d 50%, #0d213c 100%)
            `,
          }}
        />
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-10 animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>

      {/* === Main Container === */}
      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-0 items-center">
          {/* Left Side - Branding */}
          <div className="lg:col-span-2 text-center lg:text-left">
            {/* ... Phần Logo giữ nguyên như cũ ... */}
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-white to-[#dcd9e0] bg-clip-text text-transparent">
                Chào mừng
              </span>
              <br />
              <span className="text-[#e42841]">Trở lại</span>
            </h1>
            <p className="text-xl text-[#dcd9e0] font-light opacity-90">
              Nền tảng rèn luyện kỹ năng Nhân sự
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:col-span-3 lg:pl-16">
            <div
              className="relative p-8 lg:p-12 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-500"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              }}
            >
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Đăng Nhập
                  </h2>
                  <p className="text-[#dcd9e0] opacity-80">
                    Nhập thông tin để đăng nhập
                  </p>
                </div>

                {/* Success Alert */}
                {showSuccess && (
                  <div
                    className="mb-6 p-4 rounded-2xl text-center text-white font-medium animate-bounce"
                    style={{
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    ✨ Đăng nhập thành công! Đang chuyển trang...
                  </div>
                )}

                {/* Global Error Alert */}
                {errors.root && (
                  <div className="mb-6 p-4 rounded-2xl text-center text-white font-medium bg-red-500/80 animate-shake border border-red-400">
                    ⚠️ {errors.root.message}
                  </div>
                )}

                {/* === FORM BẮT ĐẦU === */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Field */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-white mb-3 opacity-90">
                      Email
                    </label>
                    <div className="relative group">
                      <input
                        type="email"
                        // Spread register props và UI handlers
                        {...registerWithUI("email")}
                        className={`w-full px-6 py-4 rounded-2xl text-white text-lg transition-all duration-300 placeholder-white/50 backdrop-blur-sm border-2 ${
                          errors.email
                            ? "border-[#e42841] bg-red-500/20"
                            : focusedField === "email"
                            ? "border-[#e42841] bg-white/10"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                        placeholder="your.email@company.com"
                      />
                      {/* Animation Border */}
                      <div
                        className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                          focusedField === "email"
                            ? "bg-gradient-to-r from-[#e42841]/20 to-transparent animate-pulse"
                            : ""
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-[#e42841] font-medium flex items-center animate-shake">
                        <span className="mr-1">⚠️</span> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <label className="block text-sm font-semibold text-white mb-3 opacity-90">
                      Mật khẩu
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        {...registerWithUI("password")}
                        className={`w-full px-6 py-4 rounded-2xl text-white text-lg transition-all duration-300 placeholder-white/50 backdrop-blur-sm border-2 ${
                          errors.password
                            ? "border-[#e42841] bg-red-500/20"
                            : focusedField === "password"
                            ? "border-[#e42841] bg-white/10"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                        placeholder="••••••••••"
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                          focusedField === "password"
                            ? "bg-gradient-to-r from-[#e42841]/20 to-transparent animate-pulse"
                            : ""
                        }`}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-[#e42841] font-medium flex items-center animate-shake">
                        <span className="mr-1">⚠️</span>{" "}
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex justify-between items-center pt-4">
                    <label className="flex items-center text-[#dcd9e0] text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("rememberMe")}
                        className="mr-2 w-4 h-4 text-[#e42841] border-gray-300 rounded focus:ring-[#e42841]"
                      />
                      Ghi nhớ đăng nhập
                    </label>
                    <button
                      type="button"
                      className="text-[#dcd9e0] hover:text-white text-sm font-medium hover:underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    // 🔥 THÊM: relative, group, overflow-hidden
                    className="relative group overflow-hidden w-full py-4 px-8 rounded-2xl text-white font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: isSubmitting
                        ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
                        : "linear-gradient(135deg, #e42841 0%, #b91c3c 50%, #e42841 100%)",
                      boxShadow: "0 15px 35px rgba(228, 40, 65, 0.4)",
                    }}
                  >
                    {/* Layer hiệu ứng ánh sáng (Giờ nó sẽ nằm gọn trong button nhờ relative và overflow-hidden ở trên) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                    {/* Nội dung nút */}
                    {isSubmitting ? (
                      <div className="relative flex items-center justify-center">
                        {" "}
                        {/* Thêm relative cho content để chắc chắn nó nổi lên trên */}
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                        Đang xác minh ...
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        {" "}
                        {/* Thêm relative cho content */}
                        <span>Đăng nhập</span>
                        <svg
                          className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
