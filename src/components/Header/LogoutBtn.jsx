import React from "react";
import { useLogoutMutation } from "../../features/auth/useAuthQueries";

function LogoutBtn(){
  const logoutMutation = useLogoutMutation();
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <button
      className="inline-block font-bold px-6 py-2 text-white border-2 border-transparent rounded-xl duration-200 hover:border-white hover:bg-transparent hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}

export default LogoutBtn;
