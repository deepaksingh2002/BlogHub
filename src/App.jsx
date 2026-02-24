import { useEffect, useRef } from 'react';
import './App.css';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from "./features/auth/authThunks";
import { selectAuthChecked } from "./features/auth/authSlice";
import { Footer, Header } from './components';
import { Outlet } from 'react-router-dom';

function App() {
  const dispatch = useDispatch();
  const authChecked = useSelector(selectAuthChecked);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!authChecked && !hasCheckedAuth.current) {
      dispatch(getCurrentUser());
      hasCheckedAuth.current = true;
    }
  }, [dispatch, authChecked]);

  return (
    <div className="min-h-screen flex flex-col bg-light">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
