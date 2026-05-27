'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

// Import intl-tel-input CSS
import 'intl-tel-input/build/css/intlTelInput.css';

export default function RegisterPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const itiRef = useRef(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    const initIti = async () => {
      const intlTelInput = (await import('intl-tel-input')).default;
      if (inputRef.current && !itiRef.current) {
        itiRef.current = intlTelInput(inputRef.current, {
          initialCountry: 'bd',
          separateDialCode: true,
          nationalMode: true,
          autoPlaceholder: 'aggressive',
          formatOnDisplay: true,
          preferredCountries: ['bd', 'in', 'pk', 'sa', 'ae'],
          utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
        });
      }
    };
    initIti();
    
    return () => {
      if (itiRef.current) {
        itiRef.current.destroy();
        itiRef.current = null;
      }
    };
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    const phone = itiRef.current ? itiRef.current.getNumber() : inputRef.current?.value;

    if (!name || !phone || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (itiRef.current && !itiRef.current.isValidNumber()) {
      setError('Please enter a valid WhatsApp number.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name,
          whatsappNumber: phone,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Auto login after register
      const loginRes = await signIn('credentials', {
        redirect: false,
        whatsappNumber: phone,
        password: password,
      });

      if (loginRes?.error) {
        setError(loginRes.error);
        setLoading(false);
      } else {
        router.push('/channels');
        router.refresh();
      }
    } catch (err) {
      setError('Failed to register');
      setLoading(false);
    }
  };

  const registerWithWhatsApp = () => {
    window.open('https://wa.me/8801XXXXXXXXX?text=Register%20Request', '_blank');
  };

  return (
    <div className="auth-card pb-8 pt-10">
      <Link href="/login" className="absolute top-[18px] left-[20px] flex items-center gap-[5px] text-[13px] text-[var(--text-muted)] no-underline hover:text-[var(--text-main)] transition-colors">
        <i className="fas fa-arrow-left"></i> Login
      </Link>

      <div style={{ textAlign: 'center', marginBottom: '22px', marginTop: '16px' }}>
        <div className="logo-title">Create Account</div>
        <div className="logo-sub">Join the PUBG UC Store community 🎮</div>
      </div>

      {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '14px' }}>
          <div className="form-label">Full Name</div>
          <input 
            type="text" 
            className="auth-form-input" 
            placeholder="Your name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div className="form-label">WhatsApp Number</div>
          <div className="phone-wrap">
            <input 
              type="tel" 
              ref={inputRef}
              className="phone-input" 
              placeholder="01XXXXXXXXX" 
              inputMode="tel"
            />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div className="form-label">Password</div>
          <div className="pass-wrap">
            <input 
              type={showPass ? 'text' : 'password'} 
              className="auth-form-input" 
              placeholder="Create a password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              className="pass-toggle" 
              type="button" 
              onClick={() => setShowPass(!showPass)}
            >
              <i className={showPass ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="auth-btn-gold w-full mt-1 block" style={{ marginTop: '8px' }}>
          {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
      </form>

      <div className="divider" style={{ marginTop: '18px', marginBottom: '18px' }}>or</div>

      <button className="btn-whatsapp" onClick={registerWithWhatsApp}>
        <i className="fab fa-whatsapp"></i> Continue with WhatsApp
      </button>

      <div className="footer-note" style={{ marginTop: '18px' }}>
        Already have an account? <Link href="/login">Login here</Link><br/>
        <span className="dim">By signing up you agree to our <Link href="#">Terms</Link> &amp; <Link href="#">Privacy Policy</Link></span>
      </div>
    </div>
  );
}
