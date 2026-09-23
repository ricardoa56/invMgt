import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

type Account = {
  id: number;
  accountName: string;
  companyDescription?: string;
  databaseName: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  registrationStatus: string;
  isActive: boolean;
};

type AccountUser = {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
};

const apiBase = import.meta.env.VITE_API_URL || "https://localhost:7144/api";
const attendanceApiBase =
  import.meta.env.VITE_ATTENDANCE_API_URL || "https://localhost:7244/api";

async function request<T>(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("accounts-token");
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new Error(
      (await response.text()) || `Request failed (${response.status})`,
    );
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("accounts-token"));
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAccounts() {
    setAccounts(await request<Account[]>("/Account"));
  }
  useEffect(() => {
    if (token) loadAccounts().catch((e: Error) => setMessage(e.message));
  }, [token]);

  if (!token)
    return (
      <Login
        onLogin={(newToken) => {
          localStorage.setItem("accounts-token", newToken);
          setToken(newToken);
        }}
      />
    );

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Inventory operations</p>
          <h1>Accounts desk</h1>
        </div>
        <div className="topbar-actions">
          <button
            className="primary-button topbar-button"
            onClick={() => setRegisterOpen(true)}
          >
            Register account
          </button>
          <button
            className="quiet-button"
            onClick={() => {
              localStorage.removeItem("accounts-token");
              setToken(null);
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="intro">
        <div>
          <p className="eyebrow">Tenant administration</p>
          <h2>Registered accounts</h2>
          <p>
            {accounts.length} account{accounts.length === 1 ? "" : "s"}{" "}
            available for user administration.
          </p>
        </div>
      </section>
      {message && <div className="feedback">{message}</div>}
      <section className="account-table-wrap">
        <table className="account-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Database</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.accountName}</strong>
                  <span>{account.contactEmail || "No email"}</span>
                </td>
                <td>{account.databaseName}</td>
                <td>
                  {[account.contactFirstName, account.contactLastName]
                    .filter(Boolean)
                    .join(" ") || "No contact name"}
                  <span>{account.contactPhone || "No phone"}</span>
                </td>
                <td>
                  {account.city || "No city"}
                  <span>{account.country || "No country"}</span>
                </td>
                <td>
                  <span
                    className={`status ${account.registrationStatus.toLowerCase()}`}
                  >
                    {account.registrationStatus}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="card-action"
                      onClick={() => setSelected(account)}
                    >
                      Users
                    </button>
                    <button
                      className="card-action"
                      onClick={() => setEditing(account)}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length && (
          <div className="empty-state">No accounts registered yet.</div>
        )}
      </section>
      {registerOpen && (
        <AccountForm
          onSaved={async (result) => {
            await loadAccounts();
            setMessage(result);
            setRegisterOpen(false);
          }}
          onClose={() => setRegisterOpen(false)}
        />
      )}
      {editing && (
        <AccountForm
          account={editing}
          onSaved={async (result) => {
            await loadAccounts();
            setMessage(result);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {selected && (
        <UserForm
          account={selected}
          onCreated={() =>
            setMessage(`User created in ${selected.accountName}.`)
          }
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [form, setForm] = useState({ account: "", username: "", password: "" });
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await request<{ token: string }>("/User/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onLogin(result.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    }
  }
  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Inventory operations</p>
        <h1>Accounts desk</h1>
        <p className="login-copy">
          Sign in with an administrator account to manage registered tenants.
        </p>
        <form onSubmit={submit} className="form-stack">
          <label>
            Account
            <input
              required
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
            />
          </label>
          <label>
            Username
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label>
            Password
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          {error && <div className="feedback error">{error}</div>}
          <button className="primary-button">Sign in</button>
        </form>
      </section>
    </main>
  );
}

function AccountForm({
  account,
  onSaved,
  onClose,
}: {
  account?: Account;
  onSaved: (message: string) => Promise<void>;
  onClose: () => void;
}) {
  const empty = {
    accountName: "",
    companyDescription: "",
    databaseName: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    addressLine1: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "",
  };
  const initial = account
    ? {
        ...empty,
        accountName: account.accountName,
        companyDescription: account.companyDescription || "",
        databaseName: account.databaseName,
        contactFirstName: account.contactFirstName || "",
        contactLastName: account.contactLastName || "",
        contactEmail: account.contactEmail || "",
        contactPhone: account.contactPhone || "",
        addressLine1: account.addressLine1 || "",
        city: account.city || "",
        country: account.country || "",
      }
    : empty;
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const update = (field: keyof typeof empty, value: string) =>
    setForm({ ...form, [field]: value });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const accounts = account ? [] : await request<Account[]>("/Account");
      const existing =
        account ||
        accounts.find(
          (item) =>
            item.databaseName.toLowerCase() ===
            form.databaseName.trim().toLowerCase(),
        );
      if (existing) {
        await request(`/Account/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            registrationStatus: existing.registrationStatus,
            isActive: existing.isActive,
          }),
        });
        setForm(empty);
        await onSaved(
          account
            ? "Account details updated successfully."
            : "Account updated successfully.",
        );
      } else {
        await request("/Account", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setForm(empty);
        await onSaved("Account registered successfully.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save account.");
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="register-panel modal account-modal" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              {account ? "Account details" : "New registration"}
            </p>
            <h3>{account ? "Edit account" : "Register database"}</h3>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="field-grid">
          <label>
            Account name
            <input
              required
              value={form.accountName}
              onChange={(e) => update("accountName", e.target.value)}
            />
          </label>
          <label className="wide">
            Company description
            <textarea
              rows={3}
              maxLength={500}
              value={form.companyDescription}
              onChange={(e) => update("companyDescription", e.target.value)}
              placeholder="Short description of the school or company"
            />
          </label>
          <label>
            Database name
            <input
              required
              readOnly={Boolean(account)}
              value={form.databaseName}
              onChange={(e) => update("databaseName", e.target.value)}
              placeholder="Account_1"
            />
          </label>
          <label>
            First name
            <input
              required
              value={form.contactFirstName}
              onChange={(e) => update("contactFirstName", e.target.value)}
            />
          </label>
          <label>
            Last name
            <input
              required
              value={form.contactLastName}
              onChange={(e) => update("contactLastName", e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(e) => update("contactEmail", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              required
              value={form.contactPhone}
              onChange={(e) => update("contactPhone", e.target.value)}
            />
          </label>
          <label className="wide">
            Address
            <input
              required
              value={form.addressLine1}
              onChange={(e) => update("addressLine1", e.target.value)}
            />
          </label>
          <label>
            City
            <input
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
          </label>
          <label>
            Country
            <input
              required
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
            />
          </label>
        </div>
        {error && <div className="feedback error">{error}</div>}
        <button className="primary-button">
          {account ? "Save changes" : "Save account"}
        </button>
      </form>
    </div>
  );
}

function UserForm({
  account,
  onCreated,
  onClose,
}: {
  account: Account;
  onCreated: () => void;
  onClose: () => void;
}) {
  const empty = {
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "",
    employeeNumber: "",
    isActive: true,
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  async function loadUsers() {
    setLoading(true);
    try {
      setUsers(
        await request<AccountUser[]>(`/User/accounts/${account.id}/users`),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadUsers();
  }, [account.id]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (editingUser) {
        await request(
          `/User/accounts/${account.id}/users/${editingUser.userId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              fullName: form.fullName,
              email: form.email,
              role: form.role,
              isActive: form.isActive,
              password: form.password || undefined,
            }),
          },
        );
      } else {
        const { employeeNumber, ...userRequest } = form;
        const createdUser = await request<AccountUser>(
          `/User/accounts/${account.id}/users`,
          { method: "POST", body: JSON.stringify(userRequest) },
        );
        if (form.role === "Teacher") {
          const token = localStorage.getItem("accounts-token");
          const teacherResponse = await fetch(`${attendanceApiBase}/teachers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              userId: createdUser.userId,
              fullName: form.fullName,
              email: form.email,
              employeeNumber,
            }),
          });
          if (!teacherResponse.ok)
            throw new Error(
              (await teacherResponse.text()) ||
                "User was created, but the teacher profile could not be created.",
            );
        }
      }
      setForm(empty);
      setEditingUser(null);
      await loadUsers();
      onCreated();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : `Unable to ${editingUser ? "update" : "create"} user.`,
      );
    }
  }
  function editUser(user: AccountUser) {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: "",
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      employeeNumber: "",
      isActive: user.isActive,
    });
    setError("");
  }
  function cancelEdit() {
    setEditingUser(null);
    setForm(empty);
    setError("");
  }
  return (
    <div className="modal-backdrop">
      <div className="modal user-modal">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{account.accountName}</p>
            <h3>Tenant users</h3>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="muted">
          Users saved in <strong>{account.databaseName}</strong>.
        </p>
        <form autoComplete="off" onSubmit={submit}>
          <h4 className="form-heading">
            {editingUser ? "Update user" : "Register user"}
          </h4>
          <div className="field-grid">
            <label>
              Username
              <input
                autoComplete="new-username"
                required
                readOnly={Boolean(editingUser)}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="new-password"
                required={!editingUser}
                minLength={8}
                type="password"
                placeholder={editingUser ? "Leave blank to keep current" : ""}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <label>
              Full name
              <input
                autoComplete="off"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                autoComplete="off"
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Role
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="" disabled>
                  Select role
                </option>
                <option>User</option>
                <option>Admin</option>
                <option>Manager</option>
              </select>
            </label>
            {editingUser && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />{" "}
                Active user
              </label>
            )}
          </div>
          {error && <div className="feedback error">{error}</div>}
          <div className="form-actions">
            <button className="primary-button">
              {editingUser ? "Save changes" : "Create user"}
            </button>
            {editingUser && (
              <button
                type="button"
                className="quiet-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <div className="user-list">
          <div className="list-heading">
            <h4>Registered users</h4>
            <span className="step">
              {users.length.toString().padStart(2, "0")}
            </span>
          </div>
          {loading ? (
            <p className="muted">Loading users...</p>
          ) : users.length ? (
            <div className="user-table-wrap">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId}>
                      <td>{user.fullName}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="role">{user.role}</span>
                      </td>
                      <td>{user.isActive ? "Active" : "Inactive"}</td>
                      <td>
                        <button
                          className="card-action"
                          type="button"
                          onClick={() => editUser(user)}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No users registered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
