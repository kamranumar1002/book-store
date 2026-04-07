import React from 'react'
import { Navigate } from 'react-router-dom'
import { decodeJwt, isJwtExpired } from '../utils/jwt'

const PrivateRoute = ({children}) => {
    const token = localStorage.getItem('token');
    const payload = decodeJwt(token);
    const isAuthed = !!token && !!payload && !isJwtExpired(payload);

    if(isAuthed) {
        return children;
    }
  
    return <Navigate to="/login" replace/>
}

export default PrivateRoute