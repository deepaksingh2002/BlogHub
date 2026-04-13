import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getDashboardPathForUser, isRoleAllowed } from '../utils/roleHelpers';

export default function Protected({ children, authentication = true, allowedRoles = [] }) {
  const navigate = useNavigate();
  const { isAuthenticated, authChecked, user } = useSelector((state) => state.auth);
  const hasRoleAccess = isRoleAllowed(user, allowedRoles);
  const shouldRedirect = authentication
    ? authChecked && (!isAuthenticated || !hasRoleAccess)
    : isAuthenticated;

  useEffect(() => {
    // For protected routes, wait until auth bootstrap is complete.
    if (authentication && !authChecked) return;

    if (authentication && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (authentication && isAuthenticated && !isRoleAllowed(user, allowedRoles)) {
      navigate(getDashboardPathForUser(user));
      return;
    }

    if (!authentication && isAuthenticated) {
      navigate(getDashboardPathForUser(user));
    }
  }, [authentication, allowedRoles, isAuthenticated, authChecked, navigate, user]);

  if ((authentication && !authChecked) || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-background text-dark dark:text-dark">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
