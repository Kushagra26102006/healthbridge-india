import authReducer, {
  setSession,
  setLoading,
  setError,
  clearSession,
} from '@/store/slices/auth-slice';
import systemReducer, {
  setBackendHealth,
  setDisconnected,
} from '@/store/slices/system-slice';
import {
  getQuickActionsForRole,
  filterQuickActions,
  getRoleDashboardHome,
  type SearchPortalRole,
} from '@/features/search/lib/quick-actions';
import {
  recordRecentPage,
  getRecentPages,
  clearRecentPages,
  setSearchHistoryEnabled,
  isSearchHistoryEnabled,
  splitHighlightSegments,
} from '@/features/search/lib/recent-navigation';

function createMockStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('Redux Store Slices — authSlice & systemSlice', () => {
  it('transitions authSlice safely across loading, setSession, setError, and clearSession', () => {
    let state = authReducer(undefined, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(false);

    state = authReducer(state, setLoading(true));
    expect(state.isLoading).toBe(true);

    const syntheticUser = {
      id: '650000000000000000000101',
      name: 'Aarav Synthetic',
      email: 'aarav@synthetic.healthbridge.test',
      phone: '9000010001',
      role: 'PATIENT' as const,
      accountStatus: 'ACTIVE' as const,
      emailVerified: true,
      phoneVerified: true,
      createdAt: new Date().toISOString(),
    };

    state = authReducer(state, setSession({ user: syntheticUser, profile: { bloodGroup: 'O+' } }));
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitialized).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user?.role).toBe('PATIENT');

    state = authReducer(state, setError('Session refresh failed'));
    expect(state.error).toBe('Session refresh failed');

    state = authReducer(state, clearSession());
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitialized).toBe(true);
  });

  it('tracks backend health connectivity accurately in systemSlice', () => {
    let state = systemReducer(undefined, { type: '@@INIT' });
    expect(state.isConnected).toBe(false);

    state = systemReducer(
      state,
      setBackendHealth({
        application: 'HealthBridge India',
        status: 'healthy',
        uptime: 120,
        timestamp: new Date().toISOString(),
        environment: 'test',
        services: { database: { status: 'connected' } },
      } as Parameters<typeof setBackendHealth>[0])
    );
    expect(state.isConnected).toBe(true);
    expect(state.lastChecked).toBeTruthy();

    state = systemReducer(state, setDisconnected());
    expect(state.isConnected).toBe(false);
  });
});

describe('Role-Aware Quick Actions & Privacy-Safe Recent Navigation', () => {
  const rolePrefixes: Record<SearchPortalRole, string> = {
    PATIENT: '/patient/',
    DOCTOR: '/doctor/',
    PHARMACY: '/pharmacy/',
    LABORATORY: '/laboratory/',
    ADMIN: '/admin/',
  };

  it('strictly isolates quick-action routes per portal role with zero cross-role leakage', () => {
    for (const [role, prefix] of Object.entries(rolePrefixes) as [SearchPortalRole, string][]) {
      const actions = getQuickActionsForRole(role);
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) {
        expect(action.role).toBe(role);
        expect(action.href.startsWith(prefix)).toBe(true);
      }
      expect(getRoleDashboardHome(role).href.startsWith(prefix)).toBe(true);
    }

    expect(getQuickActionsForRole('UNKNOWN_ROLE')).toEqual([]);
    expect(filterQuickActions('PATIENT', 'book').some((a) => a.href === '/patient/appointments/book')).toBe(
      true
    );
    expect(filterQuickActions('PATIENT', 'audit').length).toBe(0);
  });

  it('scopes recent pages per userId, rejects dynamic ObjectId routes, strips queries, and respects pause', () => {
    const storage = createMockStorage();

    // Dynamic patient record IDs must be rejected completely from client storage
    recordRecentPage(
      'user-patient-a',
      '/patient/records/650000000000000000000999?token=secret-jwt',
      storage
    );
    expect(getRecentPages('user-patient-a', storage)).toHaveLength(0);

    // Static portal routes strip query strings and hash fragments before persistence
    recordRecentPage('user-patient-a', '/patient/records?token=secret-jwt#preview', storage);
    const pagesA = getRecentPages('user-patient-a', storage);
    expect(pagesA).toHaveLength(1);
    expect(pagesA[0]?.path).toBe('/patient/records');
    expect(pagesA[0]?.path).not.toContain('secret-jwt');

    // User B must never see User A's navigation history
    expect(getRecentPages('user-patient-b', storage)).toEqual([]);

    // Disabling history clears and pauses recording
    setSearchHistoryEnabled('user-patient-a', false, storage);
    expect(isSearchHistoryEnabled('user-patient-a', storage)).toBe(false);
    expect(getRecentPages('user-patient-a', storage)).toEqual([]);
    recordRecentPage('user-patient-a', '/patient/prescriptions', storage);
    expect(getRecentPages('user-patient-a', storage)).toEqual([]);

    clearRecentPages('user-patient-a', storage);
  });

  it('splits highlight segments safely against regex metacharacters without HTML injection', () => {
    const segments = splitHighlightSegments(
      'Complete Blood Count (CBC) Report',
      'cbc (blood) .*+?'
    );
    expect(segments.some((s) => s.matched && s.text.toLowerCase() === 'cbc')).toBe(true);
    expect(segments.map((s) => s.text).join('')).toBe('Complete Blood Count (CBC) Report');
  });
});
