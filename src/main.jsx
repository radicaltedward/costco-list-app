import React, { useMemo, useState, useEffect } from "react";

const STORAGE_KEY = "costco_list_v3";

function createItem(name, category, id = Date.now()) {
  return {
    id,
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

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function App() {
  const [items, setItems] = useState(load);
  const [newItem, setNewItem] = useState("");
  const [newTobacco, setNewTobacco] = useState("");

  useEffect(() => {
    save(items);
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
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
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

  const groceries = useMemo(
    () => sortItems(items.filter((i) => i.category === "grocery")),
    [items]
  );
  const tobacco = useMemo(
    () => sortItems(items.filter((i) => i.category === "tobacco")),
    [items]
  );

  function renderList(list) {
    return list.map((item) => (
      <div
        key={item.id}
        style={{
          marginTop: 10,
          padding: 8,
          borderRadius: 6,
          background: item.quantity > 0 ? "#d1fae5" : "transparent",
          border: "1px solid #ddd",
        }}
      >
        <strong>{item.name}</strong> (Bought {item.orderCount})
        <div>
          <button onClick={() => changeQuantity(item.id, -1)}>-</button>
          {item.quantity}
          <button onClick={() => changeQuantity(item.id, 1)}>+</button>
          <button onClick={() => markBought(item.id)}>Bought</button>
          <button onClick={() => deleteItem(item.id)}>Delete</button>
        </div>
      </div>
    ));
  }

  return (
    <div style={{ padding: 20 }}>
      {/* Grocery Section */}
      <input
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addItem(newItem, "grocery");
            setNewItem("");
          }
        }}
        placeholder="Add grocery item"
      />
      <button
        onClick={() => {
          addItem(newItem, "grocery");
          setNewItem("");
        }}
      >
        Add
      </button>

      {renderList(groceries)}

      {/* Tobacco Section */}
      <div style={{ marginTop: 30 }} />

      <input
        value={newTobacco}
        onChange={(e) => setNewTobacco(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addItem(newTobacco, "tobacco");
            setNewTobacco("");
          }
        }}
        placeholder="Add tobacco item"
      />
      <button
        onClick={() => {
          addItem(newTobacco, "tobacco");
          setNewTobacco("");
        }}
      >
        Add
      </button>

      {renderList(tobacco)}
    </div>
  );
}