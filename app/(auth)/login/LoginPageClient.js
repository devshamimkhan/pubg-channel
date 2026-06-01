'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import 'intl-tel-input/build/css/intlTelInput.css';

export default function LoginPageClient() {
  const router = useRouter();
  const inputRef = useRef(null);
  const itiRef = useRef(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
          utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js',
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

  const handleLogin = async (e) => {
    e.preventDefault();
    const phone = itiRef.current ? itiRef.current.getNumber() : inputRef.current?.value;

    if (!phone || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (itiRef.current && !itiRef.current.isValidNumber()) {
      setError('Please enter a valid WhatsApp number.');
      inputRef.current?.focus();
      return;
    }

    const res = await signIn('credentials', {
      redirect: false,
      whatsappNumber: phone,
      password,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/channels');
      router.refresh();
    }
  };

  const loginWithWhatsApp = () => {
    window.open('https://wa.me/8801XXXXXXXXX?text=Login%20Request', '_blank');
  };

  return (
    <div className="auth-card">
      <Link
        href="/"
        className="absolute top-[18px] left-[20px] flex items-center gap-[5px] text-[13px] text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text-main)]"
      >
        <i className="fas fa-arrow-left"></i> Back
      </Link>

      <div style={{ textAlign: 'center', marginBottom: '22px', marginTop: '16px' }}>
        <div className="logo-title">Welcome Back</div>
        <div className="logo-sub">Sign in to your PUBG UC Store account</div>
      </div>

      {error && <div className="mb-4 text-center text-sm text-red-500">{error}</div>}

      <form onSubmit={handleLogin}>
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
          <div className="form-label">
            Password
            <Link href="#" className="text-[11px] font-medium normal-case text-[var(--gold)] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="pass-wrap">
            <input
              type={showPass ? 'text' : 'password'}
              className="auth-form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="pass-toggle" type="button" onClick={() => setShowPass(!showPass)}>
              <i className={showPass ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
            </button>
          </div>
        </div>

        <button type="submit" className="auth-btn-gold block w-full" style={{ marginTop: '8px' }}>
          LOGIN NOW
        </button>
      </form>

      <div className="divider">or continue with</div>

      <button className="btn-whatsapp" onClick={loginWithWhatsApp}>
        <i className="fab fa-whatsapp"></i> Login with WhatsApp
      </button>

      <div className="footer-note">
        Don't have an account? <Link href="/register">Register here</Link>
        <br />
        <span className="dim">
          By continuing you agree to our <Link href="#">Terms</Link> & <Link href="#">Privacy Policy</Link>
        </span>
      </div>
    </div>
  );
}
