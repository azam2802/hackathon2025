import { useState } from 'react';
import { signUpUser, signInUser, signOutUser } from '../../firebase/auth';
import { createDocument, getDocuments } from '../../firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { setupSuperAdmin, testSuperAdminLogin } from '../../directSuperAdminSetup';
import './FirebaseExample.scss';

const FirebaseExample = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUpUser(email, password, displayName);
      setMessage('Account created successfully!');
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInUser(email, password);
      setMessage('Signed in successfully!');
      setEmail('');
      setPassword('');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setMessage('Signed out successfully!');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleCreateDocument = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }
    
    try {
      const docId = await createDocument('test-collection', {
        title: 'Test Document',
        content: 'This is a test document created from React',
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      setMessage(`Document created with ID: ${docId}`);
    } catch (error) {
      setMessage('Error creating document: ' + error.message);
    }
  };

  const handleGetDocuments = async () => {
    try {
      const docs = await getDocuments('test-collection');
      setDocuments(docs);
      setMessage(`Retrieved ${docs.length} documents`);
    } catch (error) {
      setMessage('Error getting documents: ' + error.message);
    }
  };

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    try {
      const result = await setupSuperAdmin();
      if (result.success) {
        setMessage(`✅ ${result.message} Email: ${result.credentials.email} Password: ${result.credentials.password}`);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      setMessage('❌ Error creating superadmin: ' + error.message);
    }
    setLoading(false);
  };

  const handleTestSuperAdminLogin = async () => {
    setLoading(true);
    try {
      const result = await testSuperAdminLogin();
      if (result.success) {
        setMessage(`✅ ${result.message} Logged in as: ${result.user.email}`);
      } else {
        setMessage(`❌ Login failed: ${result.message}`);
      }
    } catch (error) {
      setMessage('❌ Error testing login: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="firebase-example">
      <h2>Firebase Integration Example</h2>
      
      <div className="setup-section">
        <h3>Initial Setup</h3>
        <div className="setup-buttons">
          <button 
            onClick={handleCreateSuperAdmin} 
            className="btn btn-warning"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Superadmin Account'}
          </button>
          <button 
            onClick={handleTestSuperAdminLogin} 
            className="btn btn-info"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Superadmin Login'}
          </button>
        </div>
        <p><small>Creates superadmin@gov.kg with password SuperAdmin123!</small></p>
      </div>
      
      {message && <div className="message">{message}</div>}
      
      {user ? (
        <div className="user-section">
          <h3>Welcome, {user.displayName || user.email}!</h3>
          <button onClick={handleSignOut} className="btn btn-secondary">
            Sign Out
          </button>
          
          <div className="firestore-section">
            <h4>Firestore Test</h4>
            <button onClick={handleCreateDocument} className="btn btn-primary">
              Create Test Document
            </button>
            <button onClick={handleGetDocuments} className="btn btn-primary">
              Get Documents
            </button>
            
            {documents.length > 0 && (
              <div className="documents">
                <h5>Documents:</h5>
                {documents.map(doc => (
                  <div key={doc.id} className="document">
                    <strong>{doc.title}</strong>
                    <p>{doc.content}</p>
                    <small>Created: {doc.createdAt}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="auth-section">
          <form onSubmit={handleSignIn} className="auth-form">
            <h3>Sign In / Sign Up</h3>
            <input
              type="text"
              placeholder="Display Name (for sign up)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-buttons">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
              <button 
                type="button" 
                onClick={handleSignUp}
                className="btn btn-secondary"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="debug-section">
        <h4>Debug & Testing</h4>
        <p><small>Use the buttons above for superadmin setup and testing</small></p>
      </div>
    </div>
  );
};

export default FirebaseExample;
