// hooks/useLogin.js
import { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import useAuthStore from '../../../Store/useAuthStore'

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [errorResponse, setErrorResponse] = useState("");
    const { setAuth } = useAuthStore();

    async function login(loginData) {
        setLoading(true);
        setErrorResponse("");

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}/auth/login`;
            const response = await axios.post(apiUrl, loginData);

            const { token, refreshToken } = response.data;

            try {   
                const user = jwtDecode(token);
                setAuth( token, refreshToken, user   );
            } catch (decodeError) {
                throw new Error("Failed to decode token");
            }

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Connection failed";
            setErrorResponse(message);
            return { success: false };
        } finally {
            setLoading(false);
        }
    }

    return { login, loading, errorResponse };
};