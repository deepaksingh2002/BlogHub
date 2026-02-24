import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function Protected({ children, authentication = true }) {
  const navigate = useNavigate();
  const { isAuthenticated, authChecked } = useSelector((state) => state.auth);

  useEffect(() => {
    // For protected routes, wait until auth bootstrap is complete.
    if (authentication && !authChecked) return;

    if (authentication && !isAuthenticated) {
      navigate("/login");
    }
    if (!authentication && isAuthenticated) {
      navigate("/");
    }
  }, [authentication, isAuthenticated, authChecked, navigate]);

  if (authentication && !authChecked) {
    return <h1>Loading...</h1>;
  }

  return <>{children}</>;
}
