
lines = [
    "import React, { useEffect, useState, useMemo } from 'react';",
    "import { useNavigate, Link } from 'react-router-dom';",
    "import { motion, AnimatePresence } from 'framer-motion';",
    "import {",
    "  FaTrophy, FaMedal, FaBook,",
    "  FaArrowLeft, FaSearch, FaBookOpen,",
    "} from 'react-icons/fa';",
    "import { getUserData } from '../utils/auth';",
    "import { getAllUsersStats, type UserReadingStats } from '../utils/readingStats';",
    "import apiClient from '../api/apiClient';",
]

tsx = r'''import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrophy, FaMedal, FaBook,
  FaArrowLeft, FaSearch, FaBookOpen,
} from 'react-icons/fa';
import { getUserData } from '../utils/auth';
import { getAllUsersStats, type UserReadingStats } from '../utils/readingStats';
import apiClient from '../api/apiClient';

interface LeaderEntry {
  rank: number;
  fullName: string;
  email: string;
  group: string;
  pagesRead: number;
  booksRead: number;
  totalTimeSeconds: number;
  isCurrentUser: boolean;
  rawStats?: UserReadingStats;
}

interface MonthOption {
  label: string;
  value: string;
}

function buildMonthOptions(): MonthOption[] {
  const options: MonthOption[] = [{ label: 'PLACEHOLDER_ALL', value: 'all' }];
  const now = new Date();
  const RU_MONTHS = [
    'PLACEHOLDER_JAN','PLACEHOLDER_FEB','PLACEHOLDER_MAR','PLACEHOLDER_APR','PLACEHOLDER_MAY','PLACEHOLDER_JUN',
    'PLACEHOLDER_JUL','PLACEHOLDER_AUG','PLACEHOLDER_SEP','PLACEHOLDER_OCT','PLACEHOLDER_NOV','PLACEHOLDER_DEC',
  ];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      label: `${RU_MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return options;
}

function filterPagesByMonth(stats: UserReadingStats, monthValue: string): number {
  if (monthValue === 'all') return stats.booksRead.reduce((s, b) => s + b.pagesRead, 0);
  return stats.booksRead
    .filter((b) => b.readAt && b.readAt.startsWith(monthValue))
    .reduce((s, b) => s + b.pagesRead, 0);
}

async function fetchBackendLeaderboard(): Promise<Omit<LeaderEntry, 'rank' | 'isCurrentUser'>[] | null> {
  try {
    const { data } = await apiClient.get('/stats/leaderboard/');
    if (!Array.isArray(data)) return null;
    return data.map((item: any) => ({
      fullName: item.full_name || `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim() || item.email || '',
      email: item.email || '',
      group: item.group || 'PLACEHOLDER_DASH',
      pagesRead: item.pages_read ?? 0,
      booksRead: item.books_read ?? 0,
      totalTimeSeconds: item.total_time_seconds ?? 0,
    }));
  } catch {
    return null;
  }
}

const MONTH_OPTIONS = buildMonthOptions();

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const userProfile = getUserData();

  const [rawEntries, setRawEntries] = useState<Omit<LeaderEntry, 'rank' | 'isCurrentUser'>[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTH_OPTIONS[1]?.value ?? 'all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const backendData = await fetchBackendLeaderboard();
      if (backendData && backendData.length > 0) {
        setRawEntries(backendData);
      } else {
        const localData = getAllUsersStats();
        setRawEntries(localData.map((u) => ({
          fullName: u.userName || u.userEmail,
          email: u.userEmail,
          group: u.userGroup || 'PLACEHOLDER_DASH',
          pagesRead: u.booksRead.reduce((s, b) => s + b.pagesRead, 0),
          booksRead: u.booksRead.length,
          totalTimeSeconds: u.totalTimeSeconds,
          rawStats: u,
        })));
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const rankedEntries = useMemo<LeaderEntry[]>(() => {
    const withPages = rawEntries.map((e) => ({
      ...e,
      pagesRead: e.rawStats && selectedMonth !== 'all'
        ? filterPagesByMonth(e.rawStats, selectedMonth)
        : e.pagesRead,
    }));
    return [...withPages]
      .sort((a, b) => b.pagesRead - a.pagesRead)
      .map((e, i) => ({ ...e, rank: i + 1, isCurrentUser: e.email === userProfile?.email }));
  }, [rawEntries, selectedMonth, userProfile?.email]);

  const filtered = useMemo(
    () => rankedEntries.filter(
      (e) =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.group.toLowerCase().includes(search.toLowerCase())
    ),
    [rankedEntries, search]
  );

  const myEntry = rankedEntries.find((e) => e.isCurrentUser);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-14 h-14 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">PLACEHOLDER_LOADING</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white pb-20">
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/60 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm flex-shrink-0"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">PLACEHOLDER_BACK</span>
          </button>
          <div className="flex items-center gap-2">
            <FaTrophy className="text-yellow-400 text-xl" />
            <h1 className="text-lg font-bold whitespace-nowrap">PLACEHOLDER_TITLE</h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-36 sm:w-52 focus-within:border-blue-500 transition-colors">
            <FaSearch className="text-slate-400 text-xs flex-shrink-0" />
            <input
              type="text"
              placeholder="PLACEHOLDER_SEARCH"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedMonth(opt.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedMonth === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {myEntry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-xl bg-blue-600/20 border border-blue-500/30 px-5 py-4"
          >
            <span className="text-yellow-400 font-black text-lg w-10 text-center flex-shrink-0">
              #{myEntry.rank}
            </span>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(myEntry.fullName)}&background=3b82f6&color=fff&size=64`}
              className="w-9 h-9 rounded-full border border-blue-400 flex-shrink-0"
              alt={myEntry.fullName}
            />
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-white truncate">
                {myEntry.fullName} <span className="text-blue-300 text-xs ml-1">(PLACEHOLDER_YOU)</span>
              </p>
              <p className="text-xs text-slate-400">{myEntry.group}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-blue-200 flex-shrink-0">
              <FaBookOpen className="text-blue-400" />
              <span className="font-bold">{myEntry.pagesRead}</span>
              <span className="text-slate-400 text-xs">PLACEHOLDER_P</span>
            </div>
          </motion.div>
        )}

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[3rem_1fr_150px_110px] px-4 py-3 border-b border-slate-700/60 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            <div className="text-center">#</div>
            <div>PLACEHOLDER_NAME</div>
            <div className="hidden sm:block">PLACEHOLDER_GROUP</div>
            <div className="text-right">PLACEHOLDER_PAGES</div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence>
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.email}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  className={`grid grid-cols-[3rem_1fr_150px_110px] items-center px-4 py-3 border-b border-slate-700/25 last:border-0 transition-colors ${
                    entry.isCurrentUser ? 'bg-blue-600/15' : 'hover:bg-slate-700/25'
                  }`}
                >
                  <div className="flex justify-center">
                    {entry.rank === 1 && <FaTrophy className="text-yellow-400 text-base" />}
                    {entry.rank === 2 && <FaMedal className="text-slate-300 text-base" />}
                    {entry.rank === 3 && <FaMedal className="text-amber-600 text-base" />}
                    {entry.rank > 3 && <span className="text-slate-400 text-sm">{entry.rank}</span>}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entry.fullName)}&background=334155&color=94a3b8&size=48`}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      alt={entry.fullName}
                    />
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${entry.isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                        {entry.fullName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full align-middle">PLACEHOLDER_YOU</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 sm:hidden">{entry.group}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm text-slate-300 truncate pr-2">
                    {entry.group}
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-sm ${entry.rank <= 3 ? 'text-yellow-300' : 'text-white'}`}>
                      {entry.pagesRead}
                    </span>
                    <span className="text-slate-500 text-xs ml-1">PLACEHOLDER_P</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="flex justify-center pt-2">
          <Link
            to="/catalog"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-sm transition-colors"
          >
            <FaBook /> PLACEHOLDER_READ
          </Link>
        </div>
      </div>
    </div>
  );
};

function EmptyState() {
  return (
    <div className="text-center py-16 text-slate-500">
      <FaTrophy className="text-5xl mx-auto mb-4 opacity-20" />
      <p className="text-base font-semibold mb-1">PLACEHOLDER_NODATA</p>
      <p className="text-sm">PLACEHOLDER_HINT</p>
    </div>
  );
}

export default LeaderboardPage;
'''

replacements = {
    'PLACEHOLDER_ALL': '\u0412\u0441\u0435 \u0432\u0440\u0435\u043c\u044f',
    'PLACEHOLDER_JAN': '\u042f\u043d\u0432\u0430\u0440\u044c',
    'PLACEHOLDER_FEB': '\u0424\u0435\u0432\u0440\u0430\u043b\u044c',
    'PLACEHOLDER_MAR': '\u041c\u0430\u0440\u0442',
    'PLACEHOLDER_APR': '\u0410\u043f\u0440\u0435\u043b\u044c',
    'PLACEHOLDER_MAY': '\u041c\u0430\u0439',
    'PLACEHOLDER_JUN': '\u0418\u044e\u043d\u044c',
    'PLACEHOLDER_JUL': '\u0418\u044e\u043b\u044c',
    'PLACEHOLDER_AUG': '\u0410\u0432\u0433\u0443\u0441\u0442',
    'PLACEHOLDER_SEP': '\u0421\u0435\u043d\u0442\u044f\u0431\u0440\u044c',
    'PLACEHOLDER_OCT': '\u041e\u043a\u0442\u044f\u0431\u0440\u044c',
    'PLACEHOLDER_NOV': '\u041d\u043e\u044f\u0431\u0440\u044c',
    'PLACEHOLDER_DEC': '\u0414\u0435\u043a\u0430\u0431\u0440\u044c',
    'PLACEHOLDER_DASH': '\u2014',
    'PLACEHOLDER_LOADING': '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0430...',
    'PLACEHOLDER_BACK': '\u041d\u0430\u0437\u0430\u0434',
    'PLACEHOLDER_TITLE': '\u0422\u0430\u0431\u043b\u0438\u0446\u0430 \u043b\u0438\u0434\u0435\u0440\u043e\u0432',
    'PLACEHOLDER_SEARCH': '\u041f\u043e\u0438\u0441\u043a...',
    'PLACEHOLDER_YOU': '\u0412\u044b',
    'PLACEHOLDER_P': '\u0441\u0442\u0440.',
    'PLACEHOLDER_NAME': '\u0418\u043c\u044f \u0438 \u0424\u0430\u043c\u0438\u043b\u0438\u044f',
    'PLACEHOLDER_GROUP': '\u0413\u0440\u0443\u043f\u043f\u0430',
    'PLACEHOLDER_PAGES': '\u0421\u0442\u0440\u0430\u043d\u0438\u0446',
    'PLACEHOLDER_READ': '\u0427\u0438\u0442\u0430\u0442\u044c \u043a\u043d\u0438\u0433\u0438',
    'PLACEHOLDER_NODATA': '\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0437\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434',
    'PLACEHOLDER_HINT': '\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0447\u0438\u0442\u0430\u0442\u044c \u043a\u043d\u0438\u0433\u0438, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043f\u0430\u0441\u0442\u044c \u0432 \u0440\u0435\u0439\u0442\u0438\u043d\u0433',
}

for k, v in replacements.items():
    tsx = tsx.replace(k, v)

with open(r'c:\Users\user\e-library-front\replace_leaderboard.py', 'w', encoding='utf-8') as f:
    f.write("tsx = " + repr(tsx) + "\n")
    f.write("with open(r'c:\\Users\\user\\e-library-front\\src\\pages\\LeaderboardPage.tsx', 'w', encoding='utf-8') as out:\n")
    f.write("    out.write(tsx)\n")
    f.write("print('Written OK')\n")

print("Script written")
