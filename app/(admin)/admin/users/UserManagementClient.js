'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FaBan,
  FaCheck,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaSpinner,
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

function formatJoinedDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
}

function normalizeUser(user) {
  return {
    _id: user?._id || '',
    fullName: user?.fullName || '',
    whatsappNumber: user?.whatsappNumber || '',
    role: user?.role || 'user',
    isBanned: Boolean(user?.isBanned),
    banReason: user?.banReason || '',
    createdAt: user?.createdAt || null,
  };
}

function Badge({ variant, children }) {
  return <span className={`${s.badge} ${variant}`}>{children}</span>;
}

const EMPTY_FORM = {
  fullName: '',
  whatsappNumber: '',
  password: '',
};

export default function UserManagementClient({ initialUsers = [], currentUserId = '' }) {
  const router = useRouter();
  const [users, setUsers] = useState(() => initialUsers.map(normalizeUser));
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [busyId, setBusyId] = useState('');
  const [userForm, setUserForm] = useState(EMPTY_FORM);
  const [adminForm, setAdminForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState({
    user: false,
    admin: false,
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.fullName, user.whatsappNumber, user.role]
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

  const resetForm = (role) => {
    if (role === 'admin') {
      setAdminForm(EMPTY_FORM);
      setShowPassword((prev) => ({ ...prev, admin: false }));
      return;
    }

    setUserForm(EMPTY_FORM);
    setShowPassword((prev) => ({ ...prev, user: false }));
  };

  const handleCreate = async (event, role) => {
    event.preventDefault();
    setBusyId(role === 'admin' ? 'create-admin' : 'create-user');

    const payload = role === 'admin' ? adminForm : userForm;
    const action = role === 'admin' ? createAdminAccount : createUserAccount;
    const result = await action(payload);

    if (result?.success) {
      toast.success(result.message || `${role === 'admin' ? 'Admin' : 'User'} created successfully`);
      prependUser(result.user);
      resetForm(role);
      refreshUsers();
    } else {
      toast.error(result?.message || 'Failed to create account');
    }

    setBusyId('');
  };

  const handleBan = async (userId) => {
    setBusyId(userId);

    const result = await banUser(userId);
    if (result?.success) {
      toast.success(result.message || 'User banned');
      updateUserInList(result.user);
      refreshUsers();
    } else {
      toast.error(result?.message || 'Failed to ban user');
    }

    setBusyId('');
  };

  const handleUnban = async (userId) => {
    setBusyId(userId);

    const result = await unbanUser(userId);
    if (result?.success) {
      toast.success(result.message || 'User unbanned');
      updateUserInList(result.user);
      refreshUsers();
    } else {
      toast.error(result?.message || 'Failed to unban user');
    }

    setBusyId('');
  };

  const renderCreateForm = (role) => {
    const form = role === 'admin' ? adminForm : userForm;
    const setForm = role === 'admin' ? setAdminForm : setUserForm;
    const isBusy = busyId === (role === 'admin' ? 'create-admin' : 'create-user');
    const passwordVisible = showPassword[role];

    return (
      <form autoComplete="off" onSubmit={(event) => handleCreate(event, role)}>
        <Field label="Full Name">
          <input
            className={s.formControl}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            required
          />
        </Field>

        <Field label="WhatsApp Number">
          <input
            className={s.formControl}
            autoComplete="off"
            inputMode="tel"
            spellCheck={false}
            value={form.whatsappNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
            required
          />
        </Field>

        <Field label="Password">
          <div className={s.pwWrap}>
            <input
              className={s.formControl}
              style={{ paddingRight: '52px' }}
              autoComplete="off"
              type={passwordVisible ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            <button
              type="button"
              className={s.pwToggleIcon}
              onClick={() => setShowPassword((prev) => ({ ...prev, [role]: !prev[role] }))}
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={passwordVisible}
            >
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
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
              <th>WhatsApp</th>
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
                        {initials(user.fullName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.fullName || 'Unnamed user'}</div>
                        {isCurrent ? <Badge variant={s.badgeGold}>You</Badge> : null}
                      </div>
                    </div>
                  </td>
                  <td>{user.whatsappNumber || '-'}</td>
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
                  <td className={s.colJoined}>{formatJoinedDate(user.createdAt)}</td>
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
