import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './Components/Auth/Login'
import Register from './Components/Auth/Register'
import Home from './Components/Home'
import { Toaster } from 'react-hot-toast'
import Projects from './Components/Projects'
import Project from './Components/Project'
import EditProfile from './Components/EditProfile'
import useAuthStore from './Store/useAuthStore'
import { useUserHubConnection } from './Components/hooks/useUserHubConnection'
import ProjectActivities from './Components/ProjectActivities'
export default function App() {
  const token = useAuthStore((state)=>state.token)
  const  userNotificationHubConnection = useUserHubConnection(token)  
  return (<>
    <Toaster position="top-center" reverseOrder={false} />
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} >
          <Route path='' element={<Projects /> }/>
          <Route path="projects/:id" element={<Project />} />
          <Route path="projects/:id/activities" element={<ProjectActivities />} />
          <Route path="edit-profile" element={<EditProfile />} />
        </Route>
        <Route path='/profile' element={<Navigate to="/edit-profile" replace />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />
      </Routes>
    </BrowserRouter>
  </>
  )
}
