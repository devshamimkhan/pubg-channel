'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaBan,
  FaCheck,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSpinner,
  FaUser,
  FaUserShield,
  FaUsers,
} from 'react-icons/fa';
import { banUser, createAdminAccount, createUserAccount, unbanUser } from '@/actions/settings';
import s from '../../admin.module.css';

function Field({ label, children, hint }) {
  return (
    <div className={s.formGroup}>
      <label>{label}</label>
      {children}
      {hint ? <div className={s.hint}>{hint}</div> : null}
    </div>
  );
}

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function normalizeUser(user) {
  return {
    _id: user?._id || '',
    fullName: user?.fullName || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    whatsappNumber: user?.whatsappNumber || '',
    role: user?.role || 'user',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    isBanned: Boolean(user?.isBanned),
    banReason: user?.banReason || '',
    createdAt: user?.createdAt || null,
  };
}

function Badge({ variant, children }) {
  return <span className={`${s.badge} ${variant}`}>{children}</span>;
}

export default function UserManagementClient({ initialUsers = [], currentUserId = '' }) {
  const router = useRouter();
  const [users, setUsers] = useState(() => initialUsers.map(normalizeUser));
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [userForm, setUserForm] = useState({
    fullName: '',
    displayName: '',
    email: '',
    whatsappNumber: '',
    password: '',
    avatar: '',
    bio: '',
  });

  const [adminForm, setAdminForm] = useState({
    fullName: '',
    displayName: '',
    email: '',
    whatsappNumber: '',
    password: '',
    avatar: '',
    bio: '',
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.fullName, user.displayName, user.email, user.whatsappNumber, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [users, search]);

  const refreshUsers = () => {
    router.refresh();
  };

  const updateUserInList = (updated) => {
    if (!updated?._id) return;
    setUsers((prev) => prev.map((user) => (user._id === updated._id ? normalizeUser(updated) : user)));
  };

  const prependUser = (created) => {
    if (!created?._id) return;
    setUsers((prev) => [normalizeUser(created), ...prev]);
  };

  const handleCreate = async (event, role) => {
    event.preventDefault();
    setBusyId(role === 'admin' ? 'create-admin' : 'create-user');
    setError('');
    setMessage('');

    const payload = role === 'admin' ? adminForm : userForm;
    const action = role === 'admin' ? createAdminAccount : createUserAccount;
    const result = await action(payload);

    if (result?.success) {
      setMessage(result.message || `${role === 'admin' ? 'Admin' : 'User'} created successfully`);
      prependUser(result.user);
      if (role === 'admin') {
        setAdminForm({
          fullName: '',
          displayName: '',
          email: '',
          whatsappNumber: '',
          password: '',
          avatar: '',
          bio: '',
        });
      } else {
        setUserForm({
          fullName: '',
          displayName: '',
          email: '',
          whatsappNumber: '',
          password: '',
          avatar: '',
          bio: '',
        });
      }
      refreshUsers();
    } else {
      setError(result?.message || 'Failed to create account');
    }

    setBusyId('');
  };

  const handleBan = async (userId) => {
    setBusyId(userId);
    setError('');
    setMessage('');

    const result = await banUser(userId);
    if (result?.success) {
      setMessage(result.message || 'User banned');
      updateUserInList(result.user);
      refreshUsers();
    } else {
      setError(result?.message || 'Failed to ban user');
    }

    setBusyId('');
  };

  const handleUnban = async (userId) => {
    setBusyId(userId);
    setError('');
    setMessage('');

    const result = await unbanUser(userId);
    if (result?.success) {
      setMessage(result.message || 'User unbanned');
      updateUserInList(result.user);
      refreshUsers();
    } else {
      setError(result?.message || 'Failed to unban user');
    }

    setBusyId('');
  };

  const renderCreateForm = (role) => {
    const form = role === 'admin' ? adminForm : userForm;
    const setForm = role === 'admin' ? setAdminForm : setUserForm;
    const isBusy = busyId === (role === 'admin' ? 'create-admin' : 'create-user');

    return (
      <form onSubmit={(event) => handleCreate(event, role)}>
        <div className={s.formGrid2}>
          <Field label="Full Name">
            <input
              className={s.formControl}
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
          </Field>
          <Field label="Display Name">
            <input
              className={s.formControl}
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            />
          </Field>
        </div>

        <div className={s.formGrid2}>
          <Field label="Email">
            <input
              className={s.formControl}
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </Field>
          <Field label="WhatsApp Number">
            <input
              className={s.formControl}
              value={form.whatsappNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
              required
            />
          </Field>
        </div>

        <div className={s.formGrid2}>
          <Field label="Password">
            <input
              className={s.formControl}
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </Field>
          <Field label="Avatar URL">
            <input
              className={s.formControl}
              value={form.avatar}
              onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Bio">
          <textarea
            className={`${s.formControl} ${s.formControlTextarea}`}
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
          />
        </Field>

        <div className={s.cardFooter}>
          <button type="submit" className={s.btnGold} disabled={isBusy}>
            {isBusy ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            {role === 'admin' ? 'Create Admin' : 'Create User'}
          </button>
        </div>
      </form>
    );
  };

  const renderUsersTable = () => (
    <>
      <div className={s.searchBar}>
        <FaSearch />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." />
      </div>

      <div className={s.tableWrap}>
        <table className={s.dataTable}>
          <thead>
            <tr>
              <th>User</th>
              <th className={s.colEmail}>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className={s.colJoined}>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isCurrent = String(user._id) === String(currentUserId);
              const canToggleBan = !isCurrent;

              return (
                <tr key={user._id}>
                  <td>
                    <div className={s.userCell}>
                      <div className={`${s.uAvatar} ${user.role === 'admin' ? s.uAvatarBlue : ''} ${user.isBanned ? s.uAvatarRed : ''}`}>
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          initials(user.fullName || user.displayName)
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.fullName || 'Unnamed user'}</div>
                        <div className={s.hint}>{user.whatsappNumber}</div>
                        {isCurrent ? <Badge variant={s.badgeGold}>You</Badge> : null}
                      </div>
                    </div>
                  </td>
                  <td className={s.colEmail}>{user.email || '-'}</td>
                  <td>
                    <Badge variant={user.role === 'admin' ? s.badgeBlue : s.badgeGreen}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                  <td>
                    {user.isBanned ? (
                      <Badge variant={s.badgeRed}>Banned</Badge>
                    ) : (
                      <Badge variant={s.badgeGreen}>Active</Badge>
                    )}
                  </td>
                  <td className={s.colJoined}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className={s.actionBtns}>
                      {user.isBanned ? (
                        <button
                          type="button"
                          className={`${s.iconBtn} ${s.iconBtnUnban}`}
                          onClick={() => handleUnban(user._id)}
                          disabled={busyId === user._id || !canToggleBan}
                          aria-label="Unban user"
                        >
                          {busyId === user._id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${s.iconBtn} ${s.iconBtnDel}`}
                          onClick={() => handleBan(user._id)}
                          disabled={busyId === user._id || !canToggleBan}
                          aria-label="Ban user"
                        >
                          {busyId === user._id ? <FaSpinner className="animate-spin" /> : <FaBan />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className={s.contentArea}>
      {error ? (
        <div className={`${s.alert} ${s.alertInfo}`}>
          <FaBan />
          <div>{error}</div>
        </div>
      ) : null}

      {message ? (
        <div className={`${s.alert} ${s.alertInfo}`}>
          <FaCheck />
          <div>{message}</div>
        </div>
      ) : null}

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaUsers /> User Management
        </div>

        <div className={s.tabRow}>
          <button type="button" className={`${s.tabBtn} ${activeTab === 'users' ? s.active : ''}`} onClick={() => setActiveTab('users')}>
            Users
          </button>
          <button type="button" className={`${s.tabBtn} ${activeTab === 'create-user' ? s.active : ''}`} onClick={() => setActiveTab('create-user')}>
            Create User
          </button>
          <button type="button" className={`${s.tabBtn} ${activeTab === 'create-admin' ? s.active : ''}`} onClick={() => setActiveTab('create-admin')}>
            Create Admin
          </button>
        </div>

        {activeTab === 'users' ? renderUsersTable() : renderCreateForm(activeTab === 'create-admin' ? 'admin' : 'user')}
      </div>

      <div className={s.card}>
        <div className={s.cardTitle}>
          <FaShieldAlt /> Quick Summary
        </div>
        <div className={s.formGrid2}>
          <Badge variant={s.badgeBlue}>Admins: {users.filter((user) => user.role === 'admin').length}</Badge>
          <Badge variant={s.badgeGreen}>Users: {users.filter((user) => user.role === 'user').length}</Badge>
          <Badge variant={s.badgeRed}>Banned: {users.filter((user) => user.isBanned).length}</Badge>
        </div>
      </div>
    </div>
  );
}
