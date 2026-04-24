import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "costco_list_v4";

function createItem(name, category) {
  return {
    id: Date.now() + Math.random(),
    name: name.trim(),
    category,
    quantity: 1,
    orderCount: 1,
    lastAddedAt: Date.now(),
  };
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return b.lastAddedAt - a.lastAddedAt;
  });
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function App() {
  const [items, setItems] = useState(load);
  const [newItem, setNewItem] = useState("");
  const [newTobacco, setNewTobacco] = useState("");
  const [neededOnly, setNeededOnly] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(name, category) {
    const trimmed = name.trim();
    if (!trimmed) return;

    setItems((current) => {
      const existing = current.find(
        (i) =>
          normalizeName(i.name) === normalizeName(trimmed) &&
          i.category === category
      );

      if (existing) {
        return current.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1, lastAddedAt: Date.now() }
            : i
        );
      }

      return [createItem(trimmed, category), ...current];
    });
  }

  function changeQuantity(id, amount) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + amount) }
          : item
      )
    );
  }

  function markBought(id) {
    setItems((current) =>
      current.map((item) =>
        item.id === id && item.quantity > 0
          ? {
              ...item,
              quantity: 0,
              orderCount: item.orderCount + 1,
              lastAddedAt: Date.now(),
            }
          : item
      )
    );
  }

  function deleteItem(id) {
    setItems((current) => current.filter((i) => i.id !== id));
  }

  function resetTrip() {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        quantity: 0,
      }))
    );
  }

  const groceries = useMemo(() => {
    let list = items.filter((i) => i.category === "grocery");
    if (neededOnly) list = list.filter((i) => i.quantity > 0);
    return sortItems(list);
  }, [items, neededOnly]);

  const tobacco = useMemo(() => {
    let list = items.filter((i) => i.category === "tobacco");
    if (neededOnly) list = list.filter((i) => i.quantity > 0);
    return sortItems(list);
  }, [items, neededOnly]);

  const neededCount = items.filter((i) => i.quantity > 0).length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  function renderAdder(value, setValue, category, placeholder) {
    return (
      <div style={styles.addRow}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addItem(value, category);
              setValue("");
            }
          }}
          placeholder={placeholder}
          style={styles.input}
        />
        <button
          style={styles.addButton}
          onClick={() => {
            addItem(value, category);
            setValue("");
          }}
        >
          Add
        </button>
      </div>
    );
  }

  function renderList(list) {
    return list.map((item) => (
      <div
        key={item.id}
        style={{
          ...styles.item,
          background: item.quantity > 0 ? "#d1fae5" : "#ffffff",
        }}
      >
        <div style={styles.itemTop}>
          <div>
            <strong style={styles.name}>{item.name}</strong>
            <div style={styles.meta}>Bought {item.orderCount} times</div>
          </div>

          <button style={styles.deleteButton} onClick={() => deleteItem(item.id)}>
            Delete
          </button>
        </div>

        <div style={styles.controls}>
          <button style={styles.qtyButton} onClick={() => changeQuantity(item.id, -1)}>
            −
          </button>

          <div style={styles.qty}>{item.quantity}</div>

          <button style={styles.qtyButton} onClick={() => changeQuantity(item.id, 1)}>
            +
          </button>

          <button style={styles.boughtButton} onClick={() => markBought(item.id)}>
            Bought
          </button>
        </div>
      </div>
    ));
  }

  return (
    <div style={styles.page}>
      {renderAdder(newItem, setNewItem, "grocery", "Add grocery item")}

      <div style={styles.topButtons}>
        <button
          style={{
            ...styles.toggleButton,
            background: neededOnly ? "#111827" : "#ffffff",
            color: neededOnly ? "#ffffff" : "#111827",
          }}
          onClick={() => setNeededOnly(!neededOnly)}
        >
          {neededOnly ? "Showing Needed" : "Show Needed Only"}
        </button>

        <button style={styles.resetButton} onClick={resetTrip}>
          Reset Trip
        </button>
      </div>

      <div style={styles.stats}>
        {neededCount} needed items • {totalQuantity} total quantity
      </div>

      {renderList(groceries)}

      <div style={styles.sectionGap} />

      {renderAdder(newTobacco, setNewTobacco, "tobacco", "Add tobacco item")}

      {renderList(tobacco)}
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 390,
    minHeight: "100vh",
    margin: "0 auto",
    padding: "12px 10px 28px",
    fontFamily: "-apple-system, BlinkMacSystemFont, Arial, sans-serif",
    background: "#f3f4f6",
    boxSizing: "border-box",
  },
  addRow: {
    display: "flex",
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 46,
    borderRadius: 12,
    border: "1px solid #ccc",
    padding: "0 12px",
    fontSize: 16,
    boxSizing: "border-box",
  },
  addButton: {
    width: 62,
    height: 46,
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  topButtons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 8,
  },
  toggleButton: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #111827",
    fontSize: 14,
    fontWeight: "bold",
  },
  resetButton: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#dc2626",
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  stats: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  item: {
    marginTop: 8,
    padding: 10,
    borderRadius: 14,
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "flex-start",
  },
  name: {
    fontSize: 17,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  deleteButton: {
    border: "none",
    background: "#e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 13,
  },
  controls: {
    display: "grid",
    gridTemplateColumns: "48px 52px 48px 1fr",
    gap: 8,
    marginTop: 10,
    alignItems: "center",
  },
  qtyButton: {
    height: 44,
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  qty: {
    height: 44,
    borderRadius: 12,
    background: "white",
    border: "1px solid #ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: "bold",
  },
  boughtButton: {
    height: 44,
    borderRadius: 12,
    border: "none",
    background: "#059669",
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
  sectionGap: {
    height: 26,
  },
};

createRoot(document.getElementById("root")).render(<App />);