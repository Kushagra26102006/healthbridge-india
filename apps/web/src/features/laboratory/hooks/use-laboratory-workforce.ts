/**
 * HealthBridge India — Laboratory Workforce & Operations Custom Hooks (Day 6 Task 06)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { laboratoryWorkforceApi } from '../api/laboratory-workforce-api';
import type {
  LaboratoryStaffDto,
  InviteLaboratoryStaffDto,
  UpdateLaboratoryStaffDto,
  UpdateStaffPermissionsDto,
  UpdateStaffStatusDto,
  LaboratoryStaffFilterDto,
  StaffActivityDto,
  PermissionGroupDto,
  LaboratoryStaffRole,
  LaboratoryPermission,
  LaboratoryDepartmentDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  LaboratoryShiftTemplateDto,
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
  LaboratoryShiftAssignmentDto,
  AssignShiftDto,
  RequestShiftSwapDto,
  ReviewShiftSwapDto,
  ShiftFilterDto,
  LaboratoryLeaveRequestDto,
  CreateLeaveRequestDto,
  ReviewLeaveRequestDto,
  LeaveFilterDto,
  LaboratoryStaffAvailabilityDto,
  UpdateStaffAvailabilityDto,
  LaboratoryTaskAssignmentDto,
  CreateTaskAssignmentDto,
  ReassignTaskDto,
  UpdateTaskStatusDto,
  TaskFilterDto,
  LaboratoryWorkloadDashboardDto,
} from '@healthbridge/shared-types';

// ============================================================================
// 1. STAFF DIRECTORY HOOK
// ============================================================================

export function useLaboratoryStaff(initialFilter?: LaboratoryStaffFilterDto) {
  const [filter, setFilter] = useState<LaboratoryStaffFilterDto>(initialFilter || {});
  const [staffList, setStaffList] = useState<LaboratoryStaffDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryWorkforceApi.listStaff({ ...filter, page });
      setStaffList(res.staff);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load laboratory staff directory');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const inviteStaff = async (dto: InviteLaboratoryStaffDto) => {
    const res = await laboratoryWorkforceApi.inviteStaff(dto);
    await fetchStaff();
    return res;
  };

  const updateStaffStatus = async (id: string, dto: UpdateStaffStatusDto) => {
    const updated = await laboratoryWorkforceApi.updateStaffStatus(id, dto);
    await fetchStaff();
    return updated;
  };

  return {
    staffList,
    total,
    page,
    totalPages,
    loading,
    error,
    filter,
    setFilter,
    setPage,
    refetch: fetchStaff,
    inviteStaff,
    updateStaffStatus,
  };
}

// ============================================================================
// 2. STAFF DETAIL & ACTIVITY HOOK
// ============================================================================

export function useLaboratoryStaffDetail(staffId: string) {
  const [staff, setStaff] = useState<LaboratoryStaffDto | null>(null);
  const [activities, setActivities] = useState<StaffActivityDto[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      setError(null);
      const [staffRes, actRes] = await Promise.all([
        laboratoryWorkforceApi.getStaffById(staffId),
        laboratoryWorkforceApi.getStaffActivity(staffId, 1, 20),
      ]);
      setStaff(staffRes);
      setActivities(actRes.activities);
      setActivityTotal(actRes.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStaff = async (dto: UpdateLaboratoryStaffDto) => {
    const updated = await laboratoryWorkforceApi.updateStaff(staffId, dto);
    setStaff(updated);
    return updated;
  };

  const updatePermissions = async (dto: UpdateStaffPermissionsDto) => {
    const updated = await laboratoryWorkforceApi.updateStaffPermissions(staffId, dto);
    setStaff(updated);
    return updated;
  };

  return {
    staff,
    activities,
    activityTotal,
    loading,
    error,
    refetch: fetchDetail,
    updateStaff,
    updatePermissions,
  };
}

// ============================================================================
// 3. DEPARTMENTS HOOK
// ============================================================================

export function useLaboratoryDepartments() {
  const [departments, setDepartments] = useState<LaboratoryDepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryWorkforceApi.listDepartments();
      setDepartments(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load laboratory departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = async (dto: CreateDepartmentDto) => {
    const created = await laboratoryWorkforceApi.createDepartment(dto);
    await fetchDepartments();
    return created;
  };

  const updateDepartment = async (id: string, dto: UpdateDepartmentDto) => {
    const updated = await laboratoryWorkforceApi.updateDepartment(id, dto);
    await fetchDepartments();
    return updated;
  };

  return {
    departments,
    loading,
    error,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
  };
}

// ============================================================================
// 4. SHIFT SCHEDULING HOOK
// ============================================================================

export function useLaboratoryScheduling(initialFilter?: ShiftFilterDto) {
  const [filter, setFilter] = useState<ShiftFilterDto>(initialFilter || {});
  const [templates, setTemplates] = useState<LaboratoryShiftTemplateDto[]>([]);
  const [shifts, setShifts] = useState<LaboratoryShiftAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduling = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tmplRes, shiftRes] = await Promise.all([
        laboratoryWorkforceApi.listShiftTemplates(),
        laboratoryWorkforceApi.listShifts(filter),
      ]);
      setTemplates(tmplRes);
      setShifts(shiftRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load shift schedule');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchScheduling();
  }, [fetchScheduling]);

  const createTemplate = async (dto: CreateShiftTemplateDto) => {
    const res = await laboratoryWorkforceApi.createShiftTemplate(dto);
    await fetchScheduling();
    return res;
  };

  const updateTemplate = async (id: string, dto: UpdateShiftTemplateDto) => {
    const res = await laboratoryWorkforceApi.updateShiftTemplate(id, dto);
    await fetchScheduling();
    return res;
  };

  const assignShift = async (dto: AssignShiftDto) => {
    const res = await laboratoryWorkforceApi.assignShift(dto);
    await fetchScheduling();
    return res;
  };

  const requestSwap = async (id: string, dto: RequestShiftSwapDto) => {
    const res = await laboratoryWorkforceApi.requestShiftSwap(id, dto);
    await fetchScheduling();
    return res;
  };

  const reviewSwap = async (id: string, dto: ReviewShiftSwapDto) => {
    const res = await laboratoryWorkforceApi.reviewShiftSwap(id, dto);
    await fetchScheduling();
    return res;
  };

  return {
    templates,
    shifts,
    loading,
    error,
    filter,
    setFilter,
    refetch: fetchScheduling,
    createTemplate,
    updateTemplate,
    assignShift,
    requestSwap,
    reviewSwap,
  };
}

// ============================================================================
// 5. LEAVE & AVAILABILITY HOOK
// ============================================================================

export function useLaboratoryLeave(initialFilter?: LeaveFilterDto) {
  const [filter, setFilter] = useState<LeaveFilterDto>(initialFilter || {});
  const [leaveRequests, setLeaveRequests] = useState<LaboratoryLeaveRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeave = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryWorkforceApi.listLeaveRequests(filter);
      setLeaveRequests(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeave();
  }, [fetchLeave]);

  const submitLeave = async (dto: CreateLeaveRequestDto) => {
    const res = await laboratoryWorkforceApi.submitLeaveRequest(dto);
    await fetchLeave();
    return res;
  };

  const reviewLeave = async (id: string, dto: ReviewLeaveRequestDto) => {
    const res = await laboratoryWorkforceApi.reviewLeaveRequest(id, dto);
    await fetchLeave();
    return res;
  };

  return {
    leaveRequests,
    loading,
    error,
    filter,
    setFilter,
    refetch: fetchLeave,
    submitLeave,
    reviewLeave,
  };
}

export function useStaffAvailability(staffId: string) {
  const [availability, setAvailability] = useState<LaboratoryStaffAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvail = useCallback(async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await laboratoryWorkforceApi.getStaffAvailability(staffId);
      setAvailability(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff availability');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchAvail();
  }, [fetchAvail]);

  const updateAvailability = async (dto: UpdateStaffAvailabilityDto) => {
    const res = await laboratoryWorkforceApi.updateStaffAvailability(staffId, dto);
    setAvailability(res);
    return res;
  };

  return {
    availability,
    loading,
    error,
    refetch: fetchAvail,
    updateAvailability,
  };
}

// ============================================================================
// 6. WORKLOAD ALLOCATION HOOK
// ============================================================================

export function useLaboratoryWorkload(initialFilter?: TaskFilterDto) {
  const [dashboard, setDashboard] = useState<LaboratoryWorkloadDashboardDto | null>(null);
  const [tasks, setTasks] = useState<LaboratoryTaskAssignmentDto[]>([]);
  const [filter, setFilter] = useState<TaskFilterDto>(initialFilter || {});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, taskRes] = await Promise.all([
        laboratoryWorkforceApi.getWorkloadDashboard(),
        laboratoryWorkforceApi.listTasks({ ...filter, page }),
      ]);
      setDashboard(dashRes);
      setTasks(taskRes.tasks);
      setTotal(taskRes.total);
      setTotalPages(taskRes.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load laboratory workload');
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const createTask = async (dto: CreateTaskAssignmentDto) => {
    const res = await laboratoryWorkforceApi.createTask(dto);
    await fetchWorkload();
    return res;
  };

  const reassignTask = async (id: string, dto: ReassignTaskDto) => {
    const res = await laboratoryWorkforceApi.reassignTask(id, dto);
    await fetchWorkload();
    return res;
  };

  const updateTaskStatus = async (id: string, dto: UpdateTaskStatusDto) => {
    const res = await laboratoryWorkforceApi.updateTaskStatus(id, dto);
    await fetchWorkload();
    return res;
  };

  return {
    dashboard,
    tasks,
    total,
    page,
    totalPages,
    loading,
    error,
    filter,
    setFilter,
    setPage,
    refetch: fetchWorkload,
    createTask,
    reassignTask,
    updateTaskStatus,
  };
}

// ============================================================================
// 7. PERMISSION CATALOGUE HOOK
// ============================================================================

export function useLaboratoryPermissions() {
  const [catalogue, setCatalogue] = useState<PermissionGroupDto[]>([]);
  const [rolePermissions, setRolePermissions] = useState<
    { role: LaboratoryStaffRole; permissions: LaboratoryPermission[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [cat, roles] = await Promise.all([
          laboratoryWorkforceApi.getPermissionCatalogue(),
          laboratoryWorkforceApi.getRolePermissions(),
        ]);
        setCatalogue(cat);
        setRolePermissions(roles);
      } catch (err: any) {
        setError(err?.message || 'Failed to load permission catalogue');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { catalogue, rolePermissions, loading, error };
}
