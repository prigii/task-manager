"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [error, setError] = useState<string | null>(null);

  const categories = ["General", "Work", "Personal", "Urgent"]; // Add more as needed

  // Fetch tasks on load
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsLast: true });
      if (error) {
        console.error("Fetch error:", error.message);
        setError(error.message);
      } else {
        setTasks(data || []);
      }
    };
    fetchTasks();
  }, []);

  // Add a task
  const addTask = async () => {
    if (!input.trim()) return;
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            text: input,
            done: false,
            category: category || null,
            due_date: dueDate || null,
          },
        ])
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No data returned");
      setTasks(
        [data[0], ...tasks].sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        })
      );
      setInput("");
      setDueDate("");
      setCategory("General");
      setError(null);
    } catch (err: any) {
      console.error("Add task error:", err.message);
      setError(err.message || "Failed to add task");
    }
  };

  // Toggle task completion
  const toggleDone = async (id: number, done: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ done: !done })
      .eq("id", id);
    if (error) {
      console.error("Toggle error:", error.message);
      setError(error.message);
    } else {
      setTasks(
        tasks.map((task) => (task.id === id ? { ...task, done: !done } : task))
      );
    }
  };

  // Delete a task
  const deleteTask = async (id: number) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error.message);
      setError(error.message);
    } else {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  };

  // Filter tasks by category
  const filteredTasks =
    filterCategory === "All"
      ? tasks
      : tasks.filter((task) => task.category === filterCategory);

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-lg shadow-md  mt-8 mb-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Task Manager
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Add Task Form */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border text-gray-800 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a task"
            />
            <button
              onClick={addTask}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Add
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border text-gray-800 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-2 border text-gray-800 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <label className="mr-2 text-gray-700">Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 border border-gray-300 text-gray-800 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Task List */}
        <ul className="space-y-2">
          {filteredTasks.length === 0 ? (
            <li className="text-gray-500 text-center">No tasks yet</li>
          ) : (
            filteredTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                !task.done &&
                new Date(task.due_date) < new Date();
              return (
                <li
                  key={task.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <div className="flex flex-col">
                    <span
                      onClick={() => toggleDone(task.id, task.done)}
                      className={`cursor-pointer ${
                        task.done
                          ? "line-through text-gray-500"
                          : isOverdue
                          ? "text-red-500"
                          : "text-gray-800"
                      }`}
                    >
                      {task.text}
                    </span>
                    <span className="text-sm text-gray-600">
                      {task.category || "No category"} |{" "}
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No due date"}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
