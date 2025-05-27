import { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser } from '../../firebase/firestore';
import { signOutUser } from '../../firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import './AdminPanel.scss';

const AdminPanel = ({ onBack }) => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Loading pending users...');
      const users = await getPendingUsers();
      setPendingUsers(users || []);
      setLastUpdated(new Date());
      console.log('Loaded pending users:', users);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('Не удалось загрузить ожидающих пользователей. Пожалуйста, попробуйте снова.');
      // Set empty array to avoid undefined errors
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await approveUser(userId);
      await loadPendingUsers(); // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Failed to approve user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      await rejectUser(userId);
      await loadPendingUsers(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Failed to reject user. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-left">
            {onBack && (
              <button onClick={onBack} className="back-btn">
                ← Back to Website
              </button>
            )}
            <h1>Admin Panel</h1>
          </div>
          <div className="admin-info">
            <span>Welcome, {user?.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-left">
          {onBack && (
            <button onClick={onBack} className="back-btn">
              ← Back to Website
            </button>
          )}
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-info">
          <span>Welcome, {user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button onClick={() => setError(null)} className="dismiss-btn">Скрыть</button>
            <button onClick={loadPendingUsers} className="retry-btn">Повторить</button>
          </div>
        </div>
      )}

      <div className="pending-users-section">
        <h2>Pending User Approvals ({pendingUsers.length})</h2>
        
        {pendingUsers.length === 0 ? (
          <div className="no-pending">
            <p>No pending user approvals at this time.</p>
          </div>
        ) : (
          <div className="users-list">
            {pendingUsers.map((pendingUser) => (
              <div key={pendingUser.id} className="user-card">
                <div className="user-info">
                  <h3>{pendingUser.displayName || 'User'}</h3>
                  <p className="email">{pendingUser.email}</p>
                  <p className="created">
                    Registered: {
                      pendingUser.createdAt && typeof pendingUser.createdAt.toDate === 'function'
                        ? pendingUser.createdAt.toDate().toLocaleDateString()
                        : pendingUser.createdAt instanceof Date
                          ? pendingUser.createdAt.toLocaleDateString()
                          : 'Unknown'
                    }
                  </p>
                </div>
                
                <div className="user-actions">
                  <button
                    onClick={() => handleApprove(pendingUser.id)}
                    disabled={actionLoading === pendingUser.id}
                    className="approve-btn"
                  >
                    {actionLoading === pendingUser.id ? 'Approving...' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleReject(pendingUser.id)}
                    disabled={actionLoading === pendingUser.id}
                    className="reject-btn"
                  >
                    {actionLoading === pendingUser.id ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="refresh-section">
        <div className="refresh-info">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <button 
          onClick={loadPendingUsers} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
