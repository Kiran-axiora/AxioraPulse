import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLoading } from '../context/LoadingContext';
import { registerUser } from "../api/authApi";
import useAuthStore from "../hooks/useAuth";

const Logo = ({ dark }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, lineHeight: 1 }}>
    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: dark ? 'rgba(253,245,232,0.35)' : 'rgba(22,15,8,0.35)', marginRight: 8, position: 'relative', top: -2 }}>Axiora</span>
    <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 24, letterSpacing: '-1px', color: dark ? 'var(--cream)' : 'var(--espresso)', lineHeight: 1 }}>Pulse</span>
    <div style={{ position: 'relative', width: 9, height: 9, background: 'var(--coral)', borderRadius: '50%', boxShadow: '0 0 10px rgba(255,69,0,0.55)', alignSelf: 'flex-start', marginTop: 5, marginLeft: 8, flexShrink: 0 }}>
      <div className="sonar-ring" /><div className="sonar-ring" /><div className="sonar-ring" />
    </div>
  </div>
);

export default function Register() {
  const [f, sf] = useState({
    fullName: '',
    email: '',
    password: '',
    accountType: 'non_organization',
    tenantName: '',
    tenantSlug: ''
  });

  const [busy, setBusy] = useState(false);
  const { user, initialized, initialize } = useAuthStore();
  const { stopLoading } = useLoading();
  const nav = useNavigate();

  useEffect(() => { stopLoading(); }, [stopLoading]);

  if (initialized && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const s = (k, v) => {
    sf(p => {
      const n = { ...p, [k]: v };

      if (k === 'tenantName') {
        n.tenantSlug = v
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      if (k === 'accountType' && v === 'non_organization') {
        n.tenantName = '';
        n.tenantSlug = '';
      }

      return n;
    });
  };

  const go = async (e) => {
    e.preventDefault();

    if (!f.fullName || !f.email || !f.password) {
      return toast.error("Please fill name, email and password");
    }

    if (f.password.length < 6) {
      return toast.error("Password needs 6+ characters");
    }

    if (f.accountType === "organization" && !f.tenantName.trim()) {
      return toast.error("Organisation is required");
    }

    setBusy(true);

    try {
      const res = await registerUser({
        full_name: f.fullName,
        email: f.email,
        password: f.password,
        account_type: f.accountType,
        tenant_name: f.accountType === "organization" ? f.tenantName : null,
        tenant_slug: f.accountType === "organization" ? f.tenantSlug : null,
      });

      if (res.access_token) {
        localStorage.setItem("token", res.access_token);
        await initialize(true);
        toast.success("Account created successfully!");
        nav("/dashboard");
      } else {
        toast.success("Registered! Please login.");
        nav("/login");
      }

    } catch (err) {
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        toast.error(detail.map(e => e.msg).join(", "));
      } else {
        toast.error(detail || "Registration failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 0 12px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid rgba(22,15,8,0.12)',
    fontFamily: 'Fraunces, serif',
    fontSize: 16,
    color: 'var(--espresso)',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    fontFamily: 'Syne, sans-serif',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(22,15,8,0.4)',
    display: 'block',
    marginBottom: 10
  };

  const radioBoxStyle = (active) => ({
    flex: 1,
    padding: '14px 12px',
    borderRadius: 14,
    border: active ? '2px solid var(--coral)' : '2px solid rgba(22,15,8,0.12)',
    background: active ? 'rgba(255,69,0,0.08)' : 'transparent',
    cursor: 'pointer',
    fontFamily: 'Fraunces, serif',
    fontSize: 14,
    color: 'var(--espresso)'
  });

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 480px' }}>

      <div style={{ background: 'var(--espresso)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 72 }}><Logo dark /></div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(34px,3.5vw,50px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1.5px', color: 'var(--cream)', marginBottom: 24 }}>
            Insights your team <em style={{ fontStyle: 'italic', color: 'var(--saffron)' }}>actually</em> trust.
          </h2>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 300, lineHeight: 1.7, color: 'rgba(253,245,232,0.5)', maxWidth: 380 }}>
            Set up your workspace in under a minute.
          </p>
        </div>
      </div>

      <div style={{ background: 'var(--warm-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', borderLeft: '1px solid rgba(22,15,8,0.06)', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%', maxWidth: 340 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: 40 }}>
            <Logo dark={false} />
          </Link>

          <h2 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 900, fontSize: 30, color: 'var(--espresso)', marginBottom: 6 }}>
            Create account
          </h2>

          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: 'rgba(22,15,8,0.45)', marginBottom: 30 }}>
            Select whether you belong to an organisation or not.
          </p>

          <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <label style={labelStyle}>Your name</label>
              <input
                type="text"
                value={f.fullName}
                onChange={e => s('fullName', e.target.value)}
                placeholder="Jane Smith"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={f.email}
                onChange={e => s('email', e.target.value)}
                placeholder="jane@gmail.com"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Account type</label>

              <div style={{ display: 'flex', gap: 12 }}>
                <label style={radioBoxStyle(f.accountType === 'organization')}>
                  <input
                    type="radio"
                    name="accountType"
                    value="organization"
                    checked={f.accountType === "organization"}
                    onChange={e => s("accountType", e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  Organisation
                </label>

                <label style={radioBoxStyle(f.accountType === 'non_organization')}>
                  <input
                    type="radio"
                    name="accountType"
                    value="non_organization"
                    checked={f.accountType === "non_organization"}
                    onChange={e => s("accountType", e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  Non Organisation
                </label>
              </div>
            </div>

            {f.accountType === "organization" && (
              <>
                <div>
                  <label style={labelStyle}>Organisation</label>
                  <input
                    type="text"
                    value={f.tenantName}
                    onChange={e => s('tenantName', e.target.value)}
                    placeholder="Acme Research"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Workspace URL</label>
                  <input
                    value={f.tenantSlug}
                    onChange={e =>
                      s('tenantSlug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="acme"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {f.accountType === "non_organization" && (
              <p style={{ color: 'green', fontSize: 13, margin: 0 }}>
                You can continue without organisation details.
              </p>
            )}

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={f.password}
                onChange={e => s('password', e.target.value)}
                placeholder="Min 6 characters"
                style={inputStyle}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              style={{
                marginTop: 4,
                padding: '16px 28px',
                background: busy ? 'rgba(22,15,8,0.4)' : 'var(--espresso)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: busy ? 'not-allowed' : 'pointer'
              }}
            >
              {busy ? 'Creating…' : 'Create account →'}
            </motion.button>
          </form>

          <p style={{ fontFamily: 'Fraunces, serif', fontSize: 14, color: 'rgba(22,15,8,0.4)', marginTop: 36, textAlign: 'center' }}>
            Have an account? <Link to="/login">Sign in →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}