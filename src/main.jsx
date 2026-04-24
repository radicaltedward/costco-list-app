import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "costco_list_v1";

function createItem(name) {
  return {
    id: Date.now(),
    name: name.trim(),
    quantity: 1,
    orderCount: 1,
    lastAddedAt: Date.now(),
  };
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function sortByMostUsed(items) {
  return [...items].sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return b.lastAddedAt - a.lastAddedAt;
  });
}

function totalUnits(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [newItem, setNewItem] = useState("");
  const [sortMode, setSortMode] = useState("mostUsed");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const visibleItems = useMemo(() => {
    return sortMode === "mostUsed"
      ? sortByMostUsed(items)
      : [...items].sort((a, b) => b.lastAddedAt - a.lastAddedAt);
  }, [items, sortMode]);

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;

    setItems((current) => {
      const existing = current.find(
        (i) => normalizeName(i.name) === normalizeName(trimmed)
      );

      if (existing) {
        return current.map((i) =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [createItem(trimmed), ...current];
    });

    setNewItem("");
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

  return (
    <div style={{ padding: 20 }}>
      <h1>Costco List</h1>
      <p>{items.length} items • {totalUnits(items)} units</p>

      <input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addItem()}
        placeholder="Add item"
      />
      <button onClick={addItem}>Add</button>

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setSortMode("mostUsed")}>Most Used</button>
        <button onClick={() => setSortMode("recent")}>Recent</button>
      </div>

      {visibleItems.map((item) => (
        <div key={item.id} style={{ marginTop: 15 }}>
          <strong>{item.name}</strong> (Bought {item.orderCount})

          <div>
            <button onClick={() => changeQuantity(item.id, -1)}>-</button>
            {item.quantity}
            <button onClick={() => changeQuantity(item.id, 1)}>+</button>

            <button onClick={() => markBought(item.id)}>Bought</button>
            <button onClick={() => deleteItem(item.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);