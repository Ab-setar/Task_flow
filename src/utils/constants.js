export const CATEGORIES = [
    {
        name: "Work",
        icon: "💼",
        lightBg: "bg-blue-50",
        lightText: "text-blue-700",
        darkBg: "dark:bg-blue-500/10",
        darkText: "dark:text-blue-400",
    },
    {
        name: "Personal",
        icon: "🏠",
        lightBg: "bg-emerald-50",
        lightText: "text-emerald-700",
        darkBg: "dark:bg-emerald-500/10",
        darkText: "dark:text-emerald-400",
    },
    {
        name: "Shopping",
        icon: "🛒",
        lightBg: "bg-violet-50",
        lightText: "text-violet-700",
        darkBg: "dark:bg-violet-500/10",
        darkText: "dark:text-violet-400",
    },
    {
        name: "Health",
        icon: "❤️",
        lightBg: "bg-rose-50",
        lightText: "text-rose-700",
        darkBg: "dark:bg-rose-500/10",
        darkText: "dark:text-rose-400",
    },
    {
        name: "Other",
        icon: "📌",
        lightBg: "bg-slate-50",
        lightText: "text-slate-700",
        darkBg: "dark:bg-slate-500/10",
        darkText: "dark:text-slate-400",
    },
];

export const PRIORITIES = [
    {
        name: "Low",
        icon: "🔽",
        lightBg: "bg-emerald-50",
        lightText: "text-emerald-700",
        darkBg: "dark:bg-emerald-500/10",
        darkText: "dark:text-emerald-400",
    },
    {
        name: "Medium",
        icon: "⏺️",
        lightBg: "bg-amber-50",
        lightText: "text-amber-700",
        darkBg: "dark:bg-amber-500/10",
        darkText: "dark:text-amber-400",
    },
    {
        name: "High",
        icon: "🔼",
        lightBg: "bg-rose-50",
        lightText: "text-rose-700",
        darkBg: "dark:bg-rose-500/10",
        darkText: "dark:text-rose-400",
    },
];

// Helper: get Tailwind classes for a category name
export const getCategoryStyle = (catName) => {
    const c = CATEGORIES.find((x) => x.name === catName) || CATEGORIES[4];
    return `${c.lightBg} ${c.lightText} ${c.darkBg} ${c.darkText}`;
};

// Helper: get Tailwind classes for a priority name
export const getPriorityStyle = (priName) => {
    const p = PRIORITIES.find((x) => x.name === priName) || PRIORITIES[1];
    return `${p.lightBg} ${p.lightText} ${p.darkBg} ${p.darkText}`;
};

// Helper: check if a due date is in the past
export const isOverdue = (dateStr) =>
    dateStr && new Date(dateStr) < new Date(new Date().toISOString().split("T")[0]);
