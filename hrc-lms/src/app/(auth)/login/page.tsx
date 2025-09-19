"use client";

import React, {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {loginSuccess} from "@/store/AuthSlice";
import {useDispatch} from "react-redux";
import {AppDispatch} from "@/store/store";

export default function LoginPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [focusedField, setFocusedField] = useState("");

    // Floating particles animation
    const [particles, setParticles] = useState<
        { id: number; x: number; y: number; size: number; delay: number }[]
    >([]);

    useEffect(() => {
        const newParticles = Array.from({length: 15}, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (formData.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const {name, value, type, checked} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }
    };

    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrors({email: data.error || "Đăng nhập thất bại"});
                setIsLoading(false);
                return;
            }

            // ✅ Cập nhật Redux store
            dispatch(loginSuccess({token: data.token, user: data.user}));

            setShowSuccess(true);
            setIsLoading(false);

            setTimeout(() => {
                setShowSuccess(false);
                router.push("/");
            }, 2000);
        } catch (err) {
            console.error("Login error:", err);
            setIsLoading(false);
            setErrors({email: "Có lỗi xảy ra, vui lòng thử lại!"});
        }
    };


    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 opacity-90"
                    style={{
                        background: `
              radial-gradient(circle at 20% 80%, #e42841 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #0d213c 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, #1a365d 0%, transparent 50%),
              linear-gradient(135deg, #0d213c 0%, #1a365d 50%, #0d213c 100%)
            `
                    }}
                />

                {/* Floating Particles */}
                {particles.map(particle => (
                    <div
                        key={particle.id}
                        className="absolute rounded-full bg-white opacity-10 animate-pulse"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: '3s'
                        }}
                    />
                ))}

                {/* Floating geometric shapes */}
                <div className="absolute top-20 left-20 w-32 h-32 border border-white opacity-10 rotate-45 animate-spin"
                     style={{animationDuration: '20s'}}/>
                <div
                    className="absolute bottom-20 right-20 w-24 h-24 border border-[#e42841] opacity-20 rounded-full animate-bounce"
                    style={{animationDuration: '4s'}}/>
                <div className="absolute top-1/2 right-10 w-16 h-16 bg-[#dcd9e0] opacity-10 rotate-12 animate-pulse"/>
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-5xl">
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-0 items-center">

                    {/* Left Side - Branding */}
                    <div className="lg:col-span-2 text-center lg:text-left">
                        {/* Animated Logo */}
                        <div className="flex justify-center lg:justify-start mb-8">
                            <div
                                className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                {/* Animated rings */}
                                <div
                                    className="absolute inset-0 rounded-full border-2 border-[#e42841] opacity-50 animate-spin"
                                    style={{animationDuration: '3s'}}/>
                                <div
                                    className="absolute inset-2 rounded-full border border-white opacity-30 animate-spin"
                                    style={{animationDuration: '4s', animationDirection: 'reverse'}}/>

                                <div className="relative w-20 h-20">
                                    <div
                                        className="absolute top-2 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-[#0d213c] rounded-full animate-pulse"/>
                                    <div
                                        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-10 bg-[#e42841] rounded-t-xl flex items-center justify-center shadow-lg">
                                        <div className="w-3 h-8 bg-white opacity-90"
                                             style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}}/>
                                    </div>
                                    <div
                                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-6 bg-[#0d213c] rounded-b-xl"/>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
                                <span
                                    className="bg-gradient-to-r from-white to-[#dcd9e0] bg-clip-text text-transparent">
                                  Chào mừng
                                </span>
                                <br/>
                                <span className="text-[#e42841] animate-pulse">Trở lại</span>
                            </h1>
                            <p className="text-xl text-[#dcd9e0] font-light opacity-90">
                                Nền tảng rèn luyện kỹ năng Nhân sự
                            </p>
                            <div className="hidden lg:block mt-6">
                                <div
                                    className="w-20 h-1 bg-gradient-to-r from-[#e42841] to-transparent rounded-full mb-4"/>
                                <p className="text-[#dcd9e0] opacity-80 leading-relaxed">
                                    Nâng tầm quản trị nhân sự bằng giải pháp huấn luyện sáng tạo và công nghệ tiên tiến.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="lg:col-span-3 lg:pl-16">
                        <div
                            className="relative p-8 lg:p-12 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-500"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                            }}
                        >
                            {/* Decorative elements */}
                            <div
                                className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-[#e42841]/20 to-transparent rounded-full blur-xl"/>
                            <div
                                className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-[#0d213c]/20 to-transparent rounded-full blur-lg"/>

                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        Đăng Nhập
                                    </h2>
                                    <p className="text-[#dcd9e0] opacity-80">
                                        Nhập thông tin để đăng nhập
                                    </p>
                                </div>

                                {/* Success Message */}
                                {showSuccess && (
                                    <div
                                        className="mb-6 p-4 rounded-2xl text-center text-white font-medium animate-bounce"
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)'
                                        }}>
                                        ✨ Đăng nhập thành công! Đang chuyển trang...
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Email Field */}
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-white mb-3 opacity-90">
                                            Email
                                        </label>
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('email')}
                                                onBlur={() => setFocusedField('')}
                                                className={`w-full px-6 py-4 rounded-2xl text-white text-lg transition-all duration-300 placeholder-white/50 backdrop-blur-sm border-2 ${
                                                    errors.email
                                                        ? 'border-[#e42841] bg-red-500/20'
                                                        : focusedField === 'email'
                                                            ? 'border-[#e42841] bg-white/10'
                                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                                }`}
                                                placeholder="your.email@company.com"
                                                style={{
                                                    boxShadow: focusedField === 'email' ? '0 0 30px rgba(228, 40, 65, 0.3)' : 'none'
                                                }}
                                            />
                                            {/* Animated border effect */}
                                            <div
                                                className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                                                    focusedField === 'email' ? 'bg-gradient-to-r from-[#e42841]/20 to-transparent animate-pulse' : ''
                                                }`}/>
                                        </div>
                                        {errors.email && (
                                            <p className="mt-2 text-sm text-[#e42841] font-medium flex items-center animate-shake">
                                                <span className="mr-1">⚠️</span>
                                                {errors.email}
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
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                onFocus={() => setFocusedField('password')}
                                                onBlur={() => setFocusedField('')}
                                                className={`w-full px-6 py-4 rounded-2xl text-white text-lg transition-all duration-300 placeholder-white/50 backdrop-blur-sm border-2 ${
                                                    errors.password
                                                        ? 'border-[#e42841] bg-red-500/20'
                                                        : focusedField === 'password'
                                                            ? 'border-[#e42841] bg-white/10'
                                                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                                                }`}
                                                placeholder="••••••••••"
                                                style={{
                                                    boxShadow: focusedField === 'password' ? '0 0 30px rgba(228, 40, 65, 0.3)' : 'none'
                                                }}
                                            />
                                            <div
                                                className={`absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none ${
                                                    focusedField === 'password' ? 'bg-gradient-to-r from-[#e42841]/20 to-transparent animate-pulse' : ''
                                                }`}/>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-[#e42841] font-medium flex items-center animate-shake">
                                                <span className="mr-1">⚠️</span>
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    {/* Additional Options */}
                                    <div className="flex justify-between items-center pt-4">
                                        <label className="flex items-center text-[#dcd9e0] text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="rememberMe"
                                                checked={formData.rememberMe}
                                                onChange={handleInputChange}
                                                className="mr-2 w-4 h-4 text-[#e42841] border-gray-300 rounded focus:ring-[#e42841]"
                                            />
                                            Ghi nhớ đăng nhập
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => alert('Password recovery feature coming soon!')}
                                            className="text-[#dcd9e0] hover:text-white text-sm font-medium transition-colors duration-300 hover:underline"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    </div>

                                    {/* Login Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                        className="w-full py-4 px-8 text-white text-lg font-bold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl relative overflow-hidden group"
                                        style={{
                                            background: isLoading
                                                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                                                : 'linear-gradient(135deg, #e42841 0%, #b91c3c 50%, #e42841 100%)',
                                            boxShadow: '0 15px 35px rgba(228, 40, 65, 0.4)'
                                        }}
                                    >
                                        {/* Button hover effect */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"/>

                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <div
                                                    className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"/>
                                                Đang xác minh ...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <span>Đăng nhập</span>
                                                <svg
                                                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                          d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations */}
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
                    0%, 100% {
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
};
