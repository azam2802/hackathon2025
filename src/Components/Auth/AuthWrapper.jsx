import { useAuth } from '../../Hooks/useAuth';
import { isSuperAdmin } from '../../firebase/auth';
import AuthPage from './AuthPage';
import AdminPanel from '../Admin/AdminPanel';
import './AuthWrapper.scss';

const AuthWrapper = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // No user logged in - show auth page
  if (!user) {
    return <AuthPage />;
  }

  // User is superadmin - show admin panel
  if (isSuperAdmin(user.email)) {
    return <AdminPanel />;
  }

  // Regular user - check if approved
  if (!user.isApproved) {
    return (
      <div className="pending-approval">
        <div className="pending-message">
          <h2>Account Pending Approval</h2>
          <p>Your account is waiting for administrator approval.</p>
          <p>Please check back later or contact the administrator.</p>
        </div>
      </div>
    );
  }

  // Approved user - show main app
  return children;
};

export default AuthWrapper;
