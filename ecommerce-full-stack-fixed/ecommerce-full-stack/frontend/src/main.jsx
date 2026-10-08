import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://localhost:5000/api';

const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

async function api(path, options = {}) {
  const response = await fetch(API + path, options);
  let data;
  try { data = await response.json(); } catch { data = { message: 'Invalid server response' }; }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return []; }
  });
  const [view, setView] = useState('shop');
  const [orders, setOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  async function loadProducts() {
    try {
      const data = await api('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Cannot connect to backend. Make sure the backend is running on port 5000.');
      setProducts([]);
    }
  }

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  async function login(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const d = await api('/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      setUser(d.user); setMsg('Login successful!'); setView('shop');
    } catch (e) { setError(e.message); }
  }

  async function register(e) {
    e.preventDefault(); setError(''); setMsg('');
    try {
      const d = await api('/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      setUser(d.user); setMsg('Account created successfully!'); setView('shop');
    } catch (e) { setError(e.message); }
  }

  const add = (p) => setCart(c => {
    const existing = c.find(i => i.product === p._id);
    return existing
      ? c.map(i => i.product === p._id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...c, { product: p._id, name: p.name, price: p.price, image: p.image, quantity: 1 }];
  });

  async function myOrders() {
    if (!user) return setView('login');
    setError('');
    try {
      const data = await api('/orders/mine', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setOrders(Array.isArray(data) ? data : []);
      setView('orders');
    } catch (e) { setError(e.message); }
  }

  async function loadAdminOrders() {
    setError('');
    try {
      const data = await api('/orders', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setAdminOrders(Array.isArray(data) ? data : []);
      setView('adminOrders');
    } catch (e) { setError(e.message); }
  }

  async function updateOrderStatus(id, status) {
    try {
      await api('/orders/' + id + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({ status })
      });
      await loadAdminOrders();
      setMsg('Order status updated.');
    } catch (e) { setError(e.message); }
  }

  async function checkout() {
    if (!cart.length) return;
    if (!user) return setView('login');
    setError(''); setMsg('');
    try {
      await api('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
        body: JSON.stringify({
          items: cart.map(i => ({ product: i.product, quantity: i.quantity })),
          shippingAddress: 'Demo Address, India'
        })
      });
      setCart([]); await loadProducts(); setMsg('Order placed successfully!'); await myOrders();
    } catch (e) { setError(e.message); }
  }

  function logout() {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); setView('shop'); setOrders([]); setAdminOrders([]);
  }

  return <>
    <header>
      <b>ShopSphere</b>
      <nav>
        <button onClick={() => setView('shop')}>Products</button>
        <button onClick={() => setView('cart')}>Cart ({cart.reduce((a, i) => a + i.quantity, 0)})</button>
        {user && <button onClick={myOrders}>My Orders</button>}
        {user?.role === 'admin' && <>
          <button onClick={() => setView('admin')}>Products Admin</button>
          <button onClick={loadAdminOrders}>All Orders</button>
        </>}
        {user ? <button onClick={logout}>Logout</button> : <button onClick={() => setView('login')}>Login</button>}
      </nav>
    </header>

    <main>
      {msg && <div className="msg">{msg}</div>}
      {error && <div className="msg error">{error}</div>}

      {view === 'shop' && <>
        <h1>Online Store</h1>
        <div className="grid">
          {products.length ? products.map(p => <article className="card" key={p._id}>
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3><p>{p.description}</p><strong>₹{p.price}</strong>
            <small>Stock: {p.stock}</small>
            <button disabled={!p.stock} onClick={() => add(p)}>Add to Cart</button>
          </article>) : <p>No products available. Check the backend and MongoDB.</p>}
        </div>
      </>}

      {view === 'cart' && <section>
        <h1>Your Cart</h1>
        {cart.length ? cart.map(i => <div className="row" key={i.product}>
          <span>{i.name} × {i.quantity}</span><b>₹{i.price * i.quantity}</b>
          <button onClick={() => setCart(c => c.filter(x => x.product !== i.product))}>Remove</button>
        </div>) : <p>Your cart is empty.</p>}
        {cart.length > 0 && <><h2>Total: ₹{cart.reduce((a, i) => a + i.price * i.quantity, 0)}</h2>
          <button className="primary" onClick={checkout}>Checkout</button></>}
      </section>}

      {view === 'login' && <form className="auth" onSubmit={login}>
        <h1>Login</h1><input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="primary">Login</button><p>New customer?</p>
        <button type="button" onClick={() => setView('register')}>Create Account</button>
      </form>}

      {view === 'register' && <form className="auth" onSubmit={register}>
        <h1>Create Account</h1><input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="primary">Register</button>
      </form>}

      {view === 'orders' && <section>
        <h1>My Orders</h1>
        {!orders.length ? <p>No orders found. Place an order from the cart first.</p> : orders.map(o => <div className="order" key={o._id}>
          <b>Order #{o._id.slice(-6)}</b><span>Status: <strong>{o.status}</strong></span><span>₹{o.total}</span>
          <small>{new Date(o.createdAt).toLocaleString()}</small>
          <div>{o.items?.map(i => <div key={i._id || i.product?._id}>{i.name} × {i.quantity}</div>)}</div>
        </div>)}
      </section>}

      {view === 'adminOrders' && <section>
        <h1>Order Management</h1>
        {!adminOrders.length ? <p>No customer orders found.</p> : adminOrders.map(o => <div className="order" key={o._id}>
          <b>Order #{o._id.slice(-6)}</b>
          <span>Customer: {o.user?.name || 'Unknown'} ({o.user?.email || 'N/A'})</span>
          <span>Total: ₹{o.total}</span>
          <span>{new Date(o.createdAt).toLocaleString()}</span>
          <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)}>
            <option value="Pending">Pending</option><option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option><option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <div>{o.items?.map(i => <div key={i._id || i.product?._id}>{i.name} × {i.quantity} — ₹{i.price}</div>)}</div>
        </div>)}
      </section>}

      {view === 'admin' && <Admin products={products} load={loadProducts}/>} 
    </main>
  </>;
}

function Admin({ products, load }) {
  const [t, setT] = useState({ name: '', description: '', price: '', category: '', stock: '', image: '' });
  const [err, setErr] = useState('');
  const token = localStorage.getItem('token');
  async function add() {
    try {
      await api('/products', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ ...t, price: +t.price, stock: +t.stock }) });
      setT({ name: '', description: '', price: '', category: '', stock: '', image: '' }); load();
    } catch (e) { setErr(e.message); }
  }
  async function del(id) {
    try { await api('/products/' + id, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } }); load(); }
    catch (e) { setErr(e.message); }
  }
  return <section><h1>Admin Product Management</h1>{err && <div className="msg error">{err}</div>}
    <div className="adminform">{Object.keys(t).map(k => <input key={k} placeholder={k} value={t[k]} onChange={e => setT({ ...t, [k]: e.target.value })}/>)}
      <button className="primary" onClick={add}>Add Product</button></div>
    {products.map(p => <div className="row" key={p._id}><span>{p.name} — ₹{p.price}</span><button onClick={() => del(p._id)}>Delete</button></div>)}
  </section>;
}

createRoot(document.getElementById('root')).render(<App />);
