import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../../../Services/axios_api';
import useAuthStore from '../../../Store/useAuthStore';

export const useRegister = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const { mutate: registerUser, isPending, error } = useMutation({
        mutationFn: async (credentials) => {
            const response = await api.post(
                `/auth/register`,
                credentials
            );
            return response.data;
        },
        onSuccess: (data) => {
            const token = data.token;
            const refreshToken = data.refreshToken;
            const user = jwtDecode(token);
            
            setAuth(token,refreshToken,user);
            
            navigate('/');
        }
    });

    const extractedError = error?.response?.data?.errors ;

    return { registerUser, isPending, error: extractedError };
};