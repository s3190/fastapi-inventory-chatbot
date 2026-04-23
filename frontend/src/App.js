import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";
import TaglineSection from "./TaglineSection";

const api = axios.create({
  baseURL: "http://localhost:8001",
});

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const sampleQuestions = [
    "cheapest product",
    "most expensive item",
    "which has lowest stock",
    "price of laptop",
    "stock of monitor",
  ];

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch products");
    }
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await api.get("/products/");
        setProducts(res.data);
        setError("");
      } catch (err) {
        setError("Failed to fetch products");
      }
      setLoading(false);
    };
    run();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    const q = filter.trim().toLowerCase();
    if (q) {
      filtered = products.filter((p) =>
        String(p.id).includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (
        sortField === "id" ||
        sortField === "price" ||
        sortField === "quantity"
      ) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, filter, sortField, sortDirection]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ id: "", name: "", description: "", price: "", quantity: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (editId) {
        await api.put(`/products/${editId}`, {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product updated successfully");
      } else {
        await api.post("/products/", {
          ...form,
          id: Number(form.id),
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("Product created successfully");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }

    setLoading(false);
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
    });
    setEditId(product.id);
    setMessage("");
    setError("");
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api.delete(`/products/${id}`);
      setMessage("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Delete failed");
    }

    setLoading(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    if (!chatMessage.trim()) return;

    const userMsg = { role: "user", content: chatMessage };
    const updatedHistory = [...chatHistory, userMsg];

    setChatHistory(updatedHistory);
    setChatLoading(true);

    try {
      const res = await api.post("/chat", {
        message: chatMessage,
        history: updatedHistory,
      });

      const botMsg = {
        role: "assistant",
        content: res.data.reply,
      };

      setChatHistory([...updatedHistory, botMsg]);
      setChatMessage("");
    } catch (err) {
      console.log(err);
      const errorMsg = {
        role: "assistant",
        content: "Something went wrong",
      };
      setChatHistory([...updatedHistory, errorMsg]);
    }

    setChatLoading(false);
  };

  const handleSampleClick = (question) => {
    setChatMessage(question);
  };

  const currency = (n) =>
    typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2);

  return (
    <div className="app-bg">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">📦</span>
          <h1>Susmitha FastAPI Demo APP</h1>
        </div>
        <div className="top-actions">
          <button
            className="btn btn-light"
            onClick={fetchProducts}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="container">
        <div className="stats">
          <div className="chip">Total: {products.length}</div>
          <div className="search">
            <input
              type="text"
              placeholder="Search by id, name or description..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="content-grid">
          <div className="card form-card">
            <h2>{editId ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <input
                type="number"
                name="id"
                placeholder="ID"
                value={form.id}
                onChange={handleChange}
                required
                disabled={!!editId}
              />
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                value={form.price}
                onChange={handleChange}
                required
                step="0.01"
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
              <div className="form-actions">
                <button className="btn" type="submit" disabled={loading}>
                  {editId ? "Update" : "Add"}
                </button>
                {editId && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setMessage("");
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {message && <div className="success-msg">{message}</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>

          <TaglineSection />

          <div className="card">
            <h2>Inventory Chatbot</h2>
            <form onSubmit={handleChatSubmit} className="product-form">
              <input
                type="text"
                placeholder="Ask about prices, stock, or product insights..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                required
              />
              <div className="form-actions">
                <button className="btn" type="submit" disabled={chatLoading}>
                  {chatLoading ? "Asking..." : "Ask Bot"}
                </button>
              </div>
            </form>

            <div style={{ marginTop: "12px" }}>
              <p
                style={{
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#4b5563",
                }}
              >
                Try asking:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {sampleQuestions.map((question, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSampleClick(question)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      border: "1px solid #d1d5db",
                      background: "#f9fafb",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    borderRadius: "10px",
                    background: msg.role === "user" ? "#e0f2fe" : "#dcfce7",
                  }}
                >
                  <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
                  {msg.content}
                </div>
              ))}
            </div>
          </div>

          <div className="card list-card">
            <h2>Products</h2>
            {loading ? (
              <div className="loader">Loading...</div>
            ) : (
              <div className="scroll-x">
                <table className="product-table">
                  <thead>
                    <tr>
                      <th
                        className={`sortable ${
                          sortField === "id" ? `sort-${sortDirection}` : ""
                        }`}
                        onClick={() => handleSort("id")}
                      >
                        ID
                      </th>
                      <th
                        className={`sortable ${
                          sortField === "name" ? `sort-${sortDirection}` : ""
                        }`}
                        onClick={() => handleSort("name")}
                      >
                        Name
                      </th>
                      <th>Description</th>
                      <th
                        className={`sortable ${
                          sortField === "price" ? `sort-${sortDirection}` : ""
                        }`}
                        onClick={() => handleSort("price")}
                      >
                        Price
                      </th>
                      <th
                        className={`sortable ${
                          sortField === "quantity" ? `sort-${sortDirection}` : ""
                        }`}
                        onClick={() => handleSort("quantity")}
                      >
                        Quantity
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td className="name-cell">{p.name}</td>
                        <td className="desc-cell" title={p.description}>
                          {p.description}
                        </td>
                        <td className="price-cell">${currency(p.price)}</td>
                        <td>
                          <span className="qty-badge">{p.quantity}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-edit"
                              onClick={() => handleEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-delete"
                              onClick={() => handleDelete(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;