import React from 'react'
import { useNavigate } from 'react-router-dom'
const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0].toUpperCase();
    };

function UserImage({ user }) {
    const navigate = useNavigate()

    if (user?.imageUrl)
        return (
            <img src={`${import.meta.env.VITE_API_HOST}/${user.imageUrl}`} alt="User Image" className='w-10 w-10 rounded-md' />
        )
    else
        return (<button
            onClick={() => navigate('/profile')}
            className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
        >
            {/* جلب الحروف الأولى من اسم المستخدم في الـ AuthStore */}
            {user?.fullName ? getInitials(user.fullName) : "GU"}
        </button>)
}

export default UserImage