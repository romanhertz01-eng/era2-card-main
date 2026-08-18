'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ContentType, GenerationResult, MockUser, Project, Template } from '@/types';
import { ONBOARDING_BONUS } from '@/lib/mockData';
import { api, clearToken, setToken } from '@/lib/api';

// ── API shapes ────────────────────────────────────────────────

interface ApiUser {
  id: string;
  email: string;
  name: string;
  balance: number;
  generated_count: number;
  is_guest?: boolean;
  created_at?: string;
}

interface ApiProject {
  id: string;
  name: string;
  category: string;
  marketplace: string;
  status: string;
  updated_at: string;
  cards_count?: number;
  videos_count?: number;
}

function toMockUser(u: ApiUser): MockUser {
  const parts = u.name.trim().split(' ');
  const initials = parts.map((p) => p[0] ?? '').join('').toUpperCase().slice(0, 2);
  return {
    id: u.id,
    name: u.name,
    initials: initials || 'U',
    email: u.email,
    company: '',
    tier: 'Старт',
    joinedAt: u.created_at ?? new Date().toISOString(),
  };
}

function toProject(p: ApiProject): Project {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    marketplace: p.marketplace as Project['marketplace'],
    status: p.status as Project['status'],
    updatedAt: p.updated_at,
    cardsCount: p.cards_count ?? 0,
    videosCount: p.videos_count ?? 0,
    coverMockId: p.marketplace === 'ozon' ? 'ex-ozon-1' : p.marketplace === 'ym' ? 'ex-ym-1' : 'ex-wb-1',
  };
}

// ── State shape ───────────────────────────────────────────────

interface ToastItem {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'warn';
}

interface AppState {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  user: MockUser;
  charges: number;
  generatedCount: number;
  spendCharges: (amount: number) => boolean;
  addCharges: (amount: number) => void;
  refreshUser: () => Promise<void>;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  loginAsGuest: () => Promise<'ok' | 'show_auth'>;
  register: (email: string, password: string, name: string, refCode?: string) => Promise<void>;
  logout: () => void;
  guestRegisterModal: boolean;
  openGuestRegisterModal: () => void;
  closeGuestRegisterModal: () => void;

  projects: Project[];
  createProject: (name: string, category: string, marketplace?: string) => Promise<Project | null>;
  updateProject: (id: string, patch: { status?: string }) => void;
  deleteProject: (id: string) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  onboardingDone: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  claimOnboardingBonus: () => boolean;
  bonusGranted: boolean;

  toasts: ToastItem[];
  showToast: (text: string, tone?: ToastItem['tone']) => void;

  pendingContentType: ContentType | null;
  setPendingContentType: (t: ContentType | null) => void;

  pendingTemplate: Template | null;
  setPendingTemplate: (t: Template | null) => void;

  pendingStudio: { contentType: ContentType; wish?: string; productName?: string; productPhoto?: string } | null;
  setPendingStudio: (s: { contentType: ContentType; wish?: string; productName?: string; productPhoto?: string } | null) => void;

  likedOverrides: Record<string, boolean | null>;
  setLikedOverride: (id: string, liked: boolean | null) => void;

  resultModal: { open: boolean; result: GenerationResult | null };
  openResultModal: (result: GenerationResult) => void;
  closeResultModal: () => void;

  paywallModal: { open: boolean; required: number };
  openPaywallModal: (required: number) => void;
  closePaywallModal: () => void;

  createProjectModal: { open: boolean };
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
}

const AppContext = createContext<AppState | null>(null);

const ONBOARDING_KEY = 'era2card_onboarding_done';
const BONUS_KEY = 'era2card_bonus_granted';

const DEFAULT_USER: MockUser = {
  id: '',
  name: '',
  initials: '',
  email: '',
  company: '',
  tier: 'Старт',
  joinedAt: '',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<MockUser>(DEFAULT_USER);
  const [charges, setCharges] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(true);
  const [bonusGranted, setBonusGranted] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingContentType, setPendingContentType] = useState<ContentType | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [pendingStudio, setPendingStudio] = useState<AppState['pendingStudio']>(null);
  const [likedOverrides, setLikedOverrides] = useState<Record<string, boolean | null>>({});
  const setLikedOverride = useCallback((id: string, liked: boolean | null) => {
    setLikedOverrides((prev) => ({ ...prev, [id]: liked }));
  }, []);

  const [resultModal, setResultModal] = useState<AppState['resultModal']>({ open: false, result: null });
  const [paywallModal, setPaywallModal] = useState<AppState['paywallModal']>({ open: false, required: 0 });
  const [createProjectModal, setCreateProjectModal] = useState<AppState['createProjectModal']>({ open: false });
  const [guestRegisterModal, setGuestRegisterModal] = useState(false);

  // ── Load user + projects from API ───────────────────────────

  const loadUserData = useCallback(async () => {
    try {
      const [apiUser, apiProjects] = await Promise.all([
        api.get<ApiUser>('/api/me'),
        api.get<ApiProject[]>('/api/projects'),
      ]);
      setUser(toMockUser(apiUser));
      setCharges(apiUser.balance);
      setGeneratedCount(apiUser.generated_count);
      setIsGuest(apiUser.is_guest ?? false);
      setProjects(apiProjects.map(toProject));
      setIsAuthenticated(true);
    } catch {
      clearToken();
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOnboardingDone(window.localStorage.getItem(ONBOARDING_KEY) === '1');
    setBonusGranted(window.localStorage.getItem(BONUS_KEY) === '1');
    const token = window.localStorage.getItem('era2_token');
    if (token) {
      loadUserData().finally(() => setIsAuthLoading(false));
    } else {
      setIsAuthLoading(false);
    }
  }, [loadUserData]);

  // ── Auth ─────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await api.post<{ token: string; user: ApiUser }>(
      '/api/auth/login',
      { email, password },
    );
    setToken(token);
    await loadUserData();
  }, [loadUserData]);

  const loginWithToken = useCallback(async (token: string) => {
    setToken(token);
    await loadUserData();
  }, [loadUserData]);

  const register = useCallback(async (email: string, password: string, name: string, refCode?: string) => {
    const { token } = await api.post<{ token: string; user: ApiUser }>(
      '/api/auth/register',
      { email, password, name, ...(refCode ? { ref_code: refCode } : {}) },
    );
    setToken(token);
    await loadUserData();
  }, [loadUserData]);

  const loginAsGuest = useCallback(async (): Promise<'ok' | 'show_auth'> => {
    try {
      const { token } = await api.post<{ token: string; user: ApiUser }>('/api/auth/guest', {});
      setToken(token);
      await loadUserData();
      return 'ok';
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 429) return 'show_auth';
      throw err;
    }
  }, [loadUserData]);

  const logout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setIsGuest(false);
    setUser(DEFAULT_USER);
    setCharges(0);
    setProjects([]);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await api.get<ApiUser>('/api/me');
      setCharges(apiUser.balance);
      setGeneratedCount(apiUser.generated_count);
    } catch {/* silent */}
  }, []);

  // ── Balance (optimistic for paywall check) ───────────────────

  const spendCharges = useCallback(
    (amount: number) => {
      if (charges < amount) return false;
      setCharges((c) => c - amount);
      return true;
    },
    [charges],
  );

  const addCharges = useCallback((amount: number) => {
    setCharges((c) => c + amount);
  }, []);

  // ── Projects ─────────────────────────────────────────────────

  const createProject = useCallback(async (name: string, category: string, marketplace = 'wb'): Promise<Project | null> => {
    try {
      const p = await api.post<ApiProject>('/api/projects', { name, category, marketplace });
      const project = toProject(p);
      setProjects((prev) => [project, ...prev]);
      return project;
    } catch {
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, patch: { status?: string }) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...(patch.status ? { status: patch.status as Project['status'] } : {}) } : p))
    );
    try {
      await api.patch(`/api/projects/${id}`, patch);
    } catch {
      await loadUserData(); // rollback
    }
  }, [loadUserData]);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/projects/${id}`);
    } catch {
      await loadUserData(); // rollback
    }
  }, [loadUserData]);

  // ── Onboarding ───────────────────────────────────────────────

  const completeOnboarding = useCallback(() => {
    setOnboardingDone(true);
    if (typeof window !== 'undefined') window.localStorage.setItem(ONBOARDING_KEY, '1');
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingDone(false);
    if (typeof window !== 'undefined') window.localStorage.removeItem(ONBOARDING_KEY);
  }, []);

  const claimOnboardingBonus = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (window.localStorage.getItem(BONUS_KEY) === '1') return false;
    window.localStorage.setItem(BONUS_KEY, '1');
    setBonusGranted(true);
    setCharges((c) => c + ONBOARDING_BONUS);
    return true;
  }, []);

  // ── Toast ─────────────────────────────────────────────────────

  const showToast = useCallback((text: string, tone: ToastItem['tone'] = 'info') => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  // ── Modals ────────────────────────────────────────────────────

  const openResultModal = useCallback((result: GenerationResult) => setResultModal({ open: true, result }), []);
  const closeResultModal = useCallback(() => setResultModal({ open: false, result: null }), []);
  const openPaywallModal = useCallback((required: number) => setPaywallModal({ open: true, required }), []);
  const closePaywallModal = useCallback(() => setPaywallModal({ open: false, required: 0 }), []);
  const openCreateProjectModal = useCallback(() => setCreateProjectModal({ open: true }), []);
  const closeCreateProjectModal = useCallback(() => setCreateProjectModal({ open: false }), []);

  const value = useMemo<AppState>(
    () => ({
      isAuthenticated,
      isAuthLoading,
      isGuest,
      user,
      charges,
      generatedCount,
      spendCharges,
      addCharges,
      refreshUser,
      login,
      loginWithToken,
      loginAsGuest,
      register,
      logout,
      guestRegisterModal,
      openGuestRegisterModal: () => setGuestRegisterModal(true),
      closeGuestRegisterModal: () => setGuestRegisterModal(false),
      projects,
      createProject,
      updateProject,
      deleteProject,
      activeProjectId,
      setActiveProjectId,
      onboardingDone,
      completeOnboarding,
      resetOnboarding,
      claimOnboardingBonus,
      bonusGranted,
      toasts,
      showToast,
      pendingContentType,
      setPendingContentType,
      pendingTemplate,
      setPendingTemplate,
      pendingStudio,
      setPendingStudio,
      likedOverrides,
      setLikedOverride,
      resultModal,
      openResultModal,
      closeResultModal,
      paywallModal,
      openPaywallModal,
      closePaywallModal,
      createProjectModal,
      openCreateProjectModal,
      closeCreateProjectModal,
    }),
    [
      isAuthenticated, isAuthLoading, isGuest, user, charges, generatedCount,
      spendCharges, addCharges, refreshUser, login, loginWithToken, loginAsGuest, register, logout,
      guestRegisterModal,
      projects, createProject, updateProject, deleteProject, activeProjectId, setActiveProjectId,
      onboardingDone, completeOnboarding, resetOnboarding, claimOnboardingBonus, bonusGranted,
      toasts, showToast,
      pendingContentType, pendingTemplate, pendingStudio, setPendingStudio,
      likedOverrides, setLikedOverride,
      resultModal, openResultModal, closeResultModal,
      paywallModal, openPaywallModal, closePaywallModal,
      createProjectModal, openCreateProjectModal, closeCreateProjectModal,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
