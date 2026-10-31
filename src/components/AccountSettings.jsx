import { memo, useEffect, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import {
  getAccountDetails,
  saveName,
  getPendingEmail,
  clearPendingEmail,
  requestEmailChange,
  confirmEmailChange,
  changePassword,
  sendPasswordResetCode,
  resetPassword,
  revokeSessions,
  endSession,
  deleteAccount,
  describeAccountError
} from '../utils/accountService';
import './Prompt.css';
import './AccountSettings.css';

const SIGN_IN_DELAY = 1500;

const useAction = () => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      console.error('Account change failed:', err?.name);
      setError(describeAccountError(err));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run };
};

const Field = ({ label, ...inputProps }) => (
  <label className="account-field">
    <span>{label}</span>
    <input className="account-input" {...inputProps} />
  </label>
);

const FormError = ({ error }) => error ? <p className="account-error" role="alert">{error}</p> : null;

const NameForm = ({ details, onDone, onCancel }) => {
  const [givenName, setGivenName] = useState(details.givenName);
  const [familyName, setFamilyName] = useState(details.familyName);
  const { busy, error, run } = useAction();

  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      await saveName({ givenName, familyName });
      onDone('Name saved.');
    });
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <Field label="First name" value={givenName} onChange={(e) => setGivenName(e.target.value)} autoComplete="given-name" maxLength={256} autoFocus />
      <Field label="Last name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} autoComplete="family-name" maxLength={256} />
      <FormError error={error} />
      <div className="account-form-buttons">
        <button className="prompt-button" type="submit" disabled={busy}>Save</button>
        <button className="prompt-button-cancel" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
};

const EmailForm = ({ details, pendingEmail, setPendingEmail, onDone, onCancel }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const { busy, error, run } = useAction();

  const sendCode = (address) => run(async () => {
    await requestEmailChange(address);
    setPendingEmail(address);
  });

  const handleSendCode = (e) => {
    e.preventDefault();
    const address = email.trim();
    if (address.toLowerCase() === details.email.toLowerCase()) {
      onCancel();
      return;
    }
    sendCode(address);
  };

  const handleResend = () => {
    setNotice('');
    run(async () => {
      await requestEmailChange(pendingEmail);
      setNotice('New code sent.');
    });
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    run(async () => {
      await confirmEmailChange(code.trim());
      setPendingEmail('');
      onDone('Email updated.');
    });
  };

  const handleAbandon = () => {
    clearPendingEmail();
    setPendingEmail('');
    onCancel();
  };

  if (!pendingEmail) {
    return (
      <form className="account-form" onSubmit={handleSendCode}>
        <Field label="New email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
        <p className="account-hint">We'll send a code to this address. Your current email keeps working until you confirm it.</p>
        <FormError error={error} />
        <div className="account-form-buttons">
          <button className="prompt-button" type="submit" disabled={busy}>Send code</button>
          <button className="prompt-button-cancel" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <form className="account-form" onSubmit={handleConfirm}>
      <p className="account-hint">Enter the code we sent to <strong>{pendingEmail}</strong>. Your current email keeps working until then.</p>
      <Field label="Code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required autoFocus />
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <FormError error={error} />
      <div className="account-form-buttons">
        <button className="prompt-button" type="submit" disabled={busy}>Confirm</button>
        <button className="prompt-button-cancel" type="button" onClick={handleResend} disabled={busy}>Resend code</button>
        <button className="prompt-button-cancel" type="button" onClick={handleAbandon} disabled={busy}>Cancel change</button>
      </div>
    </form>
  );
};

const PasswordForm = ({ email, onCancel }) => {
  const [resetting, setResetting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [notice, setNotice] = useState('');
  const { busy, error, run } = useAction();
  const inputType = showPasswords ? 'text' : 'password';

  const finish = async () => {
    await revokeSessions();
    setNotice('Password changed. Taking you to sign in…');
    // Stays busy through the wait, so nothing can be submitted on a session that is ending
    await new Promise(resolve => setTimeout(resolve, SIGN_IN_DELAY));
    endSession();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      if (resetting) await resetPassword(email, code.trim(), newPassword);
      else await changePassword(currentPassword, newPassword);
      await finish();
    });
  };

  const sendCode = () => {
    setNotice('');
    run(async () => {
      await sendPasswordResetCode(email);
      setResetting(true);
      setNotice(`We sent a code to ${email}.`);
    });
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      {resetting
        ? <Field key="code" label="Code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required autoFocus />
        : <Field key="current" label="Current password" type={inputType} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required autoFocus />}
      <Field label="New password" type={inputType} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
      <p className="account-hint">At least 8 characters, with an uppercase letter, a lowercase letter, a number and a symbol. You'll be signed out everywhere and asked to sign in again.</p>
      <label className="account-checkbox">
        <input type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} />
        <span>Show passwords</span>
      </label>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <FormError error={error} />
      <div className="account-form-buttons">
        <button className="prompt-button" type="submit" disabled={busy}>Change password</button>
        <button className="prompt-button-cancel" type="button" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="account-link-button" type="button" onClick={sendCode} disabled={busy}>
          {resetting ? 'Resend code' : 'Forgot your password?'}
        </button>
      </div>
    </form>
  );
};

const DeleteAccountModal = ({ email, onClose }) => {
  const ref = useRef(null);
  const [password, setPassword] = useState('');
  const { busy, error, run } = useAction();

  const close = () => {
    if (!busy) onClose();
  };

  useOnClickOutside(ref, close);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy]);

  const handleSubmit = (e) => {
    e.preventDefault();
    run(() => deleteAccount(email, password));
  };

  return (
    <div className="prompt-outer-wrapper fadeInPure-animation">
      <div className="prompt-inner-wrapper" ref={ref} role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
        <h1 id="delete-account-title">Delete your account?</h1>
        <form className="account-form" onSubmit={handleSubmit}>
          <p>This permanently deletes your boards, tasks, scores and login. It can't be undone.</p>
          <Field label="Enter your password to confirm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus />
          <FormError error={error} />
          <div className="account-form-buttons account-form-buttons-end">
            <button className="prompt-button-cancel" type="button" onClick={close} disabled={busy}>Cancel</button>
            <button className="account-danger-button" type="submit" disabled={busy}>{busy ? 'Deleting…' : 'Delete account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Row = ({ label, value, sub, actionLabel, isOpen, onOpen, children }) => (
  <div className="account-row">
    <div className="account-row-summary">
      <div className="account-row-text">
        <span className="account-row-label">{label}</span>
        <span className="account-row-value">{value}</span>
        {sub && <span className="account-row-sub">{sub}</span>}
      </div>
      {!isOpen && <button className="prompt-button-cancel account-row-button" onClick={onOpen}>{actionLabel}</button>}
    </div>
    {isOpen && children}
  </div>
);

const AccountSettings = () => {
  const [details, setDetails] = useState(getAccountDetails);
  const [pendingEmail, setPendingEmail] = useState(getPendingEmail);
  const [openRow, setOpenRow] = useState(null);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fullName = [details.givenName, details.familyName].filter(Boolean).join(' ');

  const open = (row) => {
    setNotice('');
    setOpenRow(row);
  };
  const closeRow = () => setOpenRow(null);
  const handleDone = (message) => {
    setDetails(getAccountDetails());
    setNotice(message);
    closeRow();
  };

  return (
    <div className="account-settings-wrapper">
      <h2 className="settings-headers">Account</h2>
      <hr className="settings-line" />
      <div className="account-rows">
        {notice && <p className="account-notice" role="status">{notice}</p>}
        <Row
          label="Name"
          value={fullName || 'Not set'}
          actionLabel={fullName ? 'Change' : 'Add'}
          isOpen={openRow === 'name'}
          onOpen={() => open('name')}
        >
          <NameForm details={details} onDone={handleDone} onCancel={closeRow} />
        </Row>
        <Row
          label="Email"
          value={details.email}
          sub={pendingEmail && openRow !== 'email' ? `Waiting for you to confirm ${pendingEmail}` : ''}
          actionLabel={pendingEmail ? 'Enter code' : 'Change'}
          isOpen={openRow === 'email'}
          onOpen={() => open('email')}
        >
          <EmailForm details={details} pendingEmail={pendingEmail} setPendingEmail={setPendingEmail} onDone={handleDone} onCancel={closeRow} />
        </Row>
        <Row
          label="Password"
          value="••••••••"
          actionLabel="Change"
          isOpen={openRow === 'password'}
          onOpen={() => open('password')}
        >
          <PasswordForm email={details.email} onCancel={closeRow} />
        </Row>
        <div className="account-delete">
          <span className="account-row-sub">Permanently delete your boards, tasks and login.</span>
          <button className="account-danger-button" onClick={() => setDeleting(true)}>Delete account</button>
        </div>
      </div>
      {deleting && <DeleteAccountModal email={details.email} onClose={() => setDeleting(false)} />}
    </div>
  );
};

export default memo(AccountSettings);
