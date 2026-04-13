import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { useLogoutMutation } from "../../features/auth/useAuthQueries";
import { clearAuthSession } from "../../features/auth/authSlice";
import { clearStoredAuthTokens, getStoredRefreshToken } from "../../features/auth/authSession";

function LogoutBtn({ onLogoutComplete } = {}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const handleLogout = () => {
    const refreshToken = getStoredRefreshToken();
    dispatch(clearAuthSession());
    clearStoredAuthTokens();
    navigate("/", { replace: true });
    if (typeof onLogoutComplete === "function") {
      onLogoutComplete();
    }
    logoutMutation.mutate({ refreshToken });
  };

  return (
    <button
      className="inline-flex items-center justify-center h-11 w-11 text-white border-2 border-transparent rounded-xl duration-200 hover:border-white hover:bg-transparent hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
      onClick={handleLogout}
      type="button"
      aria-label="Logout"
      title="Logout"
    >
      <HiOutlineArrowRightOnRectangle className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

export default LogoutBtn;
