import React, { useEffect, useMemo, useState } from "react";
import { format, parseISO, isBefore } from "date-fns";

const STORAGE_KEY = "advanced_todo_v1";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function ProgressRing({ value = 0, size = 62, stroke = 8 }) {
  const normalizedRadius = size - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="block">
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <g transform={`translate(${stroke}, ${stroke})`}>
        <circle
          r={normalizedRadius / 2}
          cx={normalizedRadius / 2}
          cy={normalizedRadius / 2}
          fill="transparent"
          stroke="#e6e6e6"
          strokeWidth={stroke}
        />
        <circle
          r={normalizedRadius / 2}
          cx={normalizedRadius / 2}
          cy={normalizedRadius / 2}
          fill="transparent"
          stroke="url(#g1)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${normalizedRadius / 2} ${normalizedRadius / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
        >
          {Math.round(value)}%
        </text>
      </g>
    </svg>
  );
}

function defaultTasks() {
  return [
    {
      id: uid(),
      text: "Finish the report",
      priority: "High",
      date: format(new Date(), "yyyy-MM-dd"),
      completed: false,
      category: "Work",
    },
    {
      id: uid(),
      text: "Buy groceries",
      priority: "Medium",
      date: format(new Date(Date.now() + 86400000), "yyyy-MM-dd"),
      completed: false,
      category: "Personal",
    },
  ];
}

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultTasks();
    } catch {
      return defaultTasks();
    }
  });

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all/today/overdue/completed
  const [sort, setSort] = useState("manual"); // manual/date/priority
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("dark_mode_v1");
    return stored ? JSON.parse(stored) : false;
  });

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    text: "",
    priority: "Medium",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "General",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("dark_mode_v1", JSON.stringify(dark));
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const stats = useMemo(() => {
    const total = tasks.length || 1;
    const done = tasks.filter((t) => t.completed).length;
    return { total, done, percent: (done / total) * 100 };
  }, [tasks]);

  function addTask(e) {
    e?.preventDefault();
    if (!form.text.trim()) return;
    const t = {
      id: uid(),
      text: form.text.trim(),
      priority: form.priority,
      date: form.date,
      completed: false,
      category: form.category || "General",
    };
    setTasks((s) => [t, ...s]);
    setForm({ text: "", priority: "Medium", date: format(new Date(), "yyyy-MM-dd"), category: "General" });
  }

  function toggle(id) {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function remove(id) {
    setTasks((s) => s.filter((t) => t.id !== id));
  }

  function startEdit(t) {
    setEditingId(t.id);
    setForm({ text: t.text, priority: t.priority, date: t.date, category: t.category || "General" });
  }

  function saveEdit(e) {
    e.preventDefault();
    setTasks((s) => s.map((t) => (t.id === editingId ? { ...t, ...form } : t)));
    setEditingId(null);
    setForm({ text: "", priority: "Medium", date: format(new Date(), "yyyy-MM-dd"), category: "General" });
  }

  const filtered = tasks
    .filter((t) => {
      if (!q.trim()) return true;
      return t.text.toLowerCase().includes(q.toLowerCase()) || (t.category || "").toLowerCase().includes(q.toLowerCase());
    })
    .filter((t) => {
      if (filter === "all") return true;
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (filter === "today") return t.date === todayStr;
      if (filter === "overdue") return !t.completed && isBefore(parseISO(t.date), parseISO(format(new Date(), "yyyy-MM-dd")));
      if (filter === "completed") return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (sort === "manual") return 0;
      if (sort === "date") return a.date.localeCompare(b.date);
      if (sort === "priority") {
        const map = { High: 0, Medium: 1, Low: 2 };
        return (map[a.priority] ?? 1) - (map[b.priority] ?? 1);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-slate-700 dark:to-slate-800 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">✨ Advanced To-Do List</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-700/60 px-3 py-2 rounded-2xl shadow-sm">
              <ProgressRing value={stats.percent} size={52} stroke={6} />
              <div className="text-xs">
                <div className="text-slate-700 dark:text-slate-200 font-semibold">{stats.done}/{stats.total}</div>
                <div className="text-slate-500 dark:text-slate-300">Done</div>
              </div>
            </div>

      
          </div>
        </header>

        <main className="bg-white dark:bg-slate-900/70 shadow-lg rounded-xl p-5">
          {/* add / edit form */}
          <form onSubmit={editingId ? saveEdit : addTask} className="grid grid-cols-1 md:grid-cols-[1fr,160px,120px] gap-3 mb-4">
            <input
              placeholder="Add a new task..."
              className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 outline-none bg-transparent text-slate-900 dark:text-slate-100"
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="px-3 text-white py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent "
            >
              <option className="bg-blue-900 text-white">High</option>
              <option className="bg-blue-900 text-white">Medium</option>
              <option className="bg-blue-900 text-white">Low</option>
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="px-3 text-white py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                {editingId ? "Save" : "Add"}
              </button>
            </div>
          </form>

          {/* controls */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                placeholder="Search tasks or categories..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="px-3 text-white py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-white bg-gray-800">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-lg border text-white bg-gray-800">
                <option value="manual">Manual</option>
                <option value="date">By Date</option>
                <option value="priority">By Priority</option>
              </select>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-300">
              {filtered.length} shown • {tasks.length} total
            </div>
          </section>

          {/* list */}
          <ul className="space-y-3">
            {filtered.map((t) => {
              const overdue = !t.completed && isBefore(parseISO(t.date), parseISO(format(new Date(), "yyyy-MM-dd")));
              return (
                <li key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <input className="w-5 h-5" type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
                    <div className="min-w-0">
                      <div className={`font-medium truncate ${t.completed ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                        {t.text}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${t.priority === "High" ? "bg-red-100 text-red-700" : t.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {t.priority}
                        </span>
                        <span>{t.category}</span>
                        <span className={`ml-1 ${overdue ? "text-red-600 font-semibold" : "text-slate-500"}`}>{t.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-white">
                    <button onClick={() => startEdit(t)} className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-700">Edit</button>
                    <button onClick={() => remove(t.id)} className="px-2 py-1 text-xs rounded-md bg-red-50 text-red-700">Delete</button>
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && <li className="text-center text-slate-500 py-6">No tasks found — create your first one!</li>}
          </ul>
        </main>

        <footer className="mt-4 text-center text-xs text-slate-500">
          Built with ❤️ — data saved to your browser.
        </footer>
      </div>
    </div>
  );
}
