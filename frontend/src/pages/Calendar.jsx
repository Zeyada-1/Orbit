import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Circle, Clock, Tag,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

// ── Date helpers ──────────────────────────────────────────────────────────────

function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isToday(date) {
  return isSameDay(date, new Date());
}

// Returns Monday-Sunday week containing `date`
function getWeekDays(date) {
  const d = new Date(date);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + i);
    return nd;
  });
}

// Returns day-grid cells for the month (Monday-based, up to 6 rows)
function getMonthGrid(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const start = new Date(firstDay);
  start.setDate(start.getDate() - startOffset);
  return Array.from({ length: totalCells }, (_, i) => {
    const nd = new Date(start);
    nd.setDate(nd.getDate() + i);
    return nd;
  });
}

// Groups tasks by local date key, sorts within each day by time
function groupByDate(tasks) {
  const map = {};
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const k = dateKey(new Date(t.dueDate));
    if (!map[k]) map[k] = [];
    map[k].push(t);
  }
  for (const k in map) {
    map[k].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }
  return map;
}

function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtShortDate(date) {
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtMonthYear(date) {
  return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

const PRIO = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444' };
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Shared task pill ──────────────────────────────────────────────────────────

function TaskPill({ task, onComplete, showTime = true }) {
  const color = PRIO[task.priority] || PRIO.MEDIUM;
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all group"
      style={{ background: `${color}18`, borderLeft: `3px solid ${task.completed ? '#475569' : color}` }}
    >
      <button
        onClick={() => !task.completed && onComplete(task)}
        className="flex-shrink-0"
        title={task.completed ? 'Completed' : 'Mark complete'}
      >
        {task.completed
          ? <CheckCircle2 size={12} className="text-emerald-400" />
          : <Circle size={12} className="text-slate-500 group-hover:text-violet-400 transition-colors" />}
      </button>
      <span className={`flex-1 truncate font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
        {task.title}
      </span>
      {showTime && (
        <span className="text-slate-500 flex-shrink-0 flex items-center gap-0.5">
          <Clock size={9} />
          {fmtTime(task.dueDate)}
        </span>
      )}
    </div>
  );
}

// ── Agenda view ───────────────────────────────────────────────────────────────

function AgendaView({ tasks, tasksByDate, currentDate, onComplete }) {
  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [currentDate]);

  const noDateTasks = tasks.filter((t) => !t.dueDate && !t.completed);
  const daysWithTasks = days.filter((d) => (tasksByDate[dateKey(d)] || []).length > 0);

  return (
    <div className="space-y-3">
      {noDateTasks.length > 0 && (
        <div className="glass p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">
            <Tag size={12} />
            No Due Date
          </div>
          <div className="space-y-1">
            {noDateTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm text-slate-400 py-1">
                <Circle size={12} className="text-slate-600 flex-shrink-0" />
                <span className="truncate">{t.title}</span>
                <span className="text-xs px-1.5 py-0.5 rounded ml-auto flex-shrink-0"
                  style={{ background: `${PRIO[t.priority]}18`, color: PRIO[t.priority] }}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {daysWithTasks.length === 0 && noDateTasks.length === 0 && (
        <div className="glass p-12 text-center text-slate-500">
          No quests scheduled in the next 30 days.
        </div>
      )}

      {daysWithTasks.map((day) => {
        const k = dateKey(day);
        const dayTasks = tasksByDate[k] || [];
        return (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-4"
          >
            <div className={`flex items-center gap-3 mb-3 ${isToday(day) ? 'text-violet-300' : 'text-slate-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                ${isToday(day) ? 'bg-violet-500 text-white' : 'bg-white/5'}`}>
                {day.getDate()}
              </div>
              <div>
                <div className="font-semibold text-sm">{fmtShortDate(day)}</div>
                {isToday(day) && (
                  <div className="text-xs text-violet-400">Today</div>
                )}
              </div>
              <div className="ml-auto text-xs text-slate-600">
                {dayTasks.length} quest{dayTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="space-y-1.5">
              {dayTasks.map((t) => (
                <TaskPill key={t.id} task={t} onComplete={onComplete} />
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ tasksByDate, currentDate, onComplete }) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  return (
    <div className="glass overflow-x-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-white/5 min-w-[560px]">
        {weekDays.map((d, i) => (
          <div
            key={i}
            className={`p-3 text-center border-r border-white/5 last:border-r-0
              ${isToday(d) ? 'bg-violet-600/10' : ''}`}
          >
            <div className="text-xs text-slate-500 font-semibold uppercase">{DAY_NAMES[i]}</div>
            <div
              className={`text-xl font-bold mt-0.5 mx-auto w-9 h-9 flex items-center justify-center rounded-full
                ${isToday(d) ? 'bg-violet-500 text-white' : 'text-white'}`}
            >
              {d.getDate()}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {d.toLocaleDateString([], { month: 'short' })}
            </div>
          </div>
        ))}
      </div>

      {/* Task cells */}
      <div className="grid grid-cols-7 min-w-[560px]">
        {weekDays.map((d, i) => {
          const k = dateKey(d);
          const dayTasks = tasksByDate[k] || [];
          return (
            <div
              key={i}
              className={`min-h-36 p-2 border-r border-white/5 last:border-r-0
                ${isToday(d) ? 'bg-violet-600/5' : ''}`}
            >
              {dayTasks.length === 0 ? (
                <div className="text-xs text-slate-700 text-center pt-4">—</div>
              ) : (
                <div className="space-y-1">
                  {dayTasks.map((t) => (
                    <TaskPill key={t.id} task={t} onComplete={onComplete} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ tasksByDate, currentDate, onComplete }) {
  const [selected, setSelected] = useState(null);
  const grid = useMemo(() => getMonthGrid(currentDate), [currentDate]);
  const currentMonth = currentDate.getMonth();

  const selectedTasks = selected ? (tasksByDate[dateKey(selected)] || []) : [];

  return (
    <div>
      <div className="glass overflow-hidden">
        {/* Day name header */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const k = dateKey(d);
            const dayTasks = tasksByDate[k] || [];
            const inMonth = d.getMonth() === currentMonth;
            const sel = selected && isSameDay(d, selected);
            return (
              <div
                key={i}
                onClick={() => setSelected(sel ? null : d)}
                className={`min-h-[90px] p-1.5 border-r border-b border-white/5 cursor-pointer transition-colors
                  ${inMonth ? '' : 'opacity-25'}
                  ${isToday(d) ? 'bg-violet-600/10' : 'hover:bg-white/[0.03]'}
                  ${sel ? 'bg-violet-600/20 ring-1 ring-inset ring-violet-500/50' : ''}`}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full mb-1
                    ${isToday(d) ? 'bg-violet-500 text-white' : 'text-slate-300'}`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="truncate text-xs px-1 py-0.5 rounded font-medium"
                      style={{
                        background: `${PRIO[t.priority]}20`,
                        color: t.completed ? '#64748b' : PRIO[t.priority],
                        textDecoration: t.completed ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-slate-600 px-1">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day task detail */}
      {selected && (
        <motion.div
          key={dateKey(selected)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 mt-3"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-violet-300">{fmtShortDate(selected)}</div>
            <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-white text-xs">
              Close
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <p className="text-slate-500 text-sm">No quests due on this day.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map((t) => (
                <TaskPill key={t.id} task={t} onComplete={onComplete} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Year view ─────────────────────────────────────────────────────────────────

function YearView({ tasksByDate, currentDate }) {
  const year = currentDate.getFullYear();
  const today = new Date();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }, (_, mi) => {
        const daysInMonth = new Date(year, mi + 1, 0).getDate();
        const firstDow = new Date(year, mi, 1).getDay();
        const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Monday-based
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === mi;

        return (
          <div key={mi} className="glass p-3">
            <div
              className={`text-sm font-bold mb-2 ${isCurrentMonth ? 'text-violet-400' : 'text-slate-300'}`}
            >
              {MONTH_NAMES[mi]}
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dn, dni) => (
                <div key={dni} className="text-center text-slate-600" style={{ fontSize: '8px' }}>
                  {dn}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {Array.from({ length: startOffset }, (_, i) => (
                <div key={`e${i}`} style={{ width: 16, height: 16 }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, di) => {
                const day = di + 1;
                const k = `${year}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const count = (tasksByDate[k] || []).length;
                const isThisToday = today.getFullYear() === year && today.getMonth() === mi && today.getDate() === day;

                return (
                  <div
                    key={day}
                    className="flex items-center justify-center"
                    style={{ width: 16, height: 16 }}
                    title={count > 0 ? `${count} quest${count !== 1 ? 's' : ''}` : String(day)}
                  >
                    {count > 0 ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                        style={{
                          fontSize: '7px',
                          background: count >= 4 ? '#7c3aed' : count === 3 ? '#6d28d9' : count === 2 ? '#5b21b6' : '#4c1d95',
                        }}
                      >
                        {count}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '8px',
                          color: isThisToday ? '#a78bfa' : '#334155',
                          fontWeight: isThisToday ? 700 : 400,
                        }}
                      >
                        {day}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Calendar page ────────────────────────────────────────────────────────

const VIEWS = [
  { key: 'agenda', label: 'Agenda' },
  { key: 'week',   label: 'Week'   },
  { key: 'month',  label: 'Month'  },
  { key: 'year',   label: 'Year'   },
];

export default function Calendar() {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks').then((r) => {
      setTasks(r.data);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load quests');
      setLoading(false);
    });
  }, []);

  const tasksByDate = useMemo(() => groupByDate(tasks), [tasks]);

  const handleComplete = async (task) => {
    try {
      const res = await api.patch(`/tasks/${task.id}/complete`);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...res.data.task } : t));
      const { xpGained, earlyBonus } = res.data;
      const msg = earlyBonus > 0
        ? `+${xpGained} XP (${earlyBonus} early bonus!) ⚡`
        : `+${xpGained} XP earned!`;
      toast.success(msg);
    } catch {
      toast.error('Failed to complete quest');
    }
  };

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === 'week')  d.setDate(d.getDate() + dir * 7);
    else if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'year')  d.setFullYear(d.getFullYear() + dir);
    else d.setDate(d.getDate() + dir * 30); // agenda
    setCurrentDate(d);
  };

  const getTitle = () => {
    if (view === 'year') return String(currentDate.getFullYear());
    if (view === 'agenda') {
      return `Agenda · ${currentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (view === 'week') {
      const [first, , , , , , last] = getWeekDays(currentDate);
      if (first.getMonth() === last.getMonth()) {
        return `${first.toLocaleDateString([], { month: 'long' })} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
      }
      return `${first.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return fmtMonthYear(currentDate);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-violet-400 animate-pulse text-lg">Loading schedule...</div>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays size={24} className="text-violet-400" />
              Schedule
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Your quests across time</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View selector */}
            <div
              className="flex rounded-xl overflow-hidden p-0.5 gap-0.5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.25)' }}
            >
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    view === v.key
                      ? 'bg-violet-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="glass p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="glass px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors rounded-xl"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                className="glass p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Current period label */}
        <div className="text-slate-300 font-semibold mb-4 text-lg">{getTitle()}</div>

        {/* View content */}
        <motion.div
          key={`${view}-${dateKey(currentDate)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {view === 'agenda' && (
            <AgendaView
              tasks={tasks}
              tasksByDate={tasksByDate}
              currentDate={currentDate}
              onComplete={handleComplete}
            />
          )}
          {view === 'week' && (
            <WeekView
              tasksByDate={tasksByDate}
              currentDate={currentDate}
              onComplete={handleComplete}
            />
          )}
          {view === 'month' && (
            <MonthView
              tasksByDate={tasksByDate}
              currentDate={currentDate}
              onComplete={handleComplete}
            />
          )}
          {view === 'year' && (
            <YearView
              tasksByDate={tasksByDate}
              currentDate={currentDate}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
