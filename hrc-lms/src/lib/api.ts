import axios, {AxiosRequestConfig} from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                // gọi refresh API
                await api.post("/auth/refresh");

                // retry request gốc
                return api.request(error.config);
            } catch (refreshErr) {
                console.error("Refresh failed:", refreshErr);
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Wrapper: GET / POST / PUT / DELETE
const APIClient = {
    get: async <T>(
        url: string,
        params?: Record<string, any>,      // 👈 cho phép truyền "body" dưới dạng query
        config?: AxiosRequestConfig
    ): Promise<T> => {
        const res = await api.get<T>(url, {...config, params});
        return res.data;
    },

    post: async <T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
        const res = await api.post<T>(url, body, config);
        return res.data;
    },

    put: async <T>(url: string, body?: any, config?: AxiosRequestConfig): Promise<T> => {
        const res = await api.put<T>(url, body, config);
        return res.data;
    },

    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const res = await api.delete<T>(url, config);
        return res.data;
    }
};

// Xuất cả APIClient (cho tiện gọi) và api (cho interceptor)
export {api};
export default APIClient;
