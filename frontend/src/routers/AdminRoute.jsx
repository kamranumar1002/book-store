import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';
import { decodeJwt, isJwtExpired } from '../utils/jwt';

const AdminRoute = ({children}) => {
  const token = localStorage.getItem('token');
  const payload = decodeJwt(token);
  const isAdmin = payload?.role === 'admin' && !isJwtExpired(payload);

  if(!token || !payload || !isAdmin) {
    return <Navigate to="/admin"/>
  }
  return children ?  children : <Outlet/>;
}

export default AdminRoute