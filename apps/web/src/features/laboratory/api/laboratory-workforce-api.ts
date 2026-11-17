/**
 * HealthBridge India — Laboratory Workforce & Operations API Client (Day 6 Task 06)
 * Frontend client for Staff Directory, Invitations, Role Permissions, Departments,
 * Shift Scheduling, Availability, Leave Tracking, and Workload Allocation.
 */

import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  ApiResponse,
  LaboratoryStaffDto,
  LaboratoryStaffListResponseDto,
  InviteLaboratoryStaffDto,
  AcceptLaboratoryStaffInviteDto,
  UpdateLaboratoryStaffDto,
  UpdateStaffPermissionsDto,
  UpdateStaffStatusDto,
  LaboratoryStaffFilterDto,
  StaffActivityListResponseDto,
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
  BatchAssignShiftDto,
  UpdateShiftAssignmentDto,
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

export const laboratoryWorkforceApi = {
  // ===========================================================================
  // 1. STAFF DIRECTORY & LIFECYCLE
  // ===========================================================================

  async listStaff(params?: LaboratoryStaffFilterDto): Promise<LaboratoryStaffListResponseDto> {
    const res = await apiClient.get<ApiResponse<LaboratoryStaffListResponseDto>>(
      API_ENDPOINTS.LABORATORY.STAFF,
      { params }
    );
    return res.data.data!;
  },

  async inviteStaff(
    dto: InviteLaboratoryStaffDto
  ): Promise<{ staff: LaboratoryStaffDto; invitationToken?: string }> {
    const res = await apiClient.post<
      ApiResponse<LaboratoryStaffDto> & { invitationToken?: string }
    >(API_ENDPOINTS.LABORATORY.STAFF_INVITE, dto);
    return {
      staff: res.data.data!,
      invitationToken: res.data.invitationToken,
    };
  },

  async acceptInvite(dto: AcceptLaboratoryStaffInviteDto): Promise<LaboratoryStaffDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryStaffDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_ACCEPT_INVITE,
      dto
    );
    return res.data.data!;
  },

  async getStaffById(id: string): Promise<LaboratoryStaffDto> {
    const res = await apiClient.get<ApiResponse<LaboratoryStaffDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_DETAIL(id)
    );
    return res.data.data!;
  },

  async updateStaff(id: string, dto: UpdateLaboratoryStaffDto): Promise<LaboratoryStaffDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryStaffDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  async updateStaffPermissions(
    id: string,
    dto: UpdateStaffPermissionsDto
  ): Promise<LaboratoryStaffDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryStaffDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_PERMISSIONS(id),
      dto
    );
    return res.data.data!;
  },

  async updateStaffStatus(id: string, dto: UpdateStaffStatusDto): Promise<LaboratoryStaffDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryStaffDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_STATUS(id),
      dto
    );
    return res.data.data!;
  },

  async getStaffActivity(
    id: string,
    page = 1,
    limit = 20
  ): Promise<StaffActivityListResponseDto> {
    const res = await apiClient.get<ApiResponse<StaffActivityListResponseDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_ACTIVITY(id),
      { params: { page, limit } }
    );
    return res.data.data!;
  },

  // ===========================================================================
  // 2. PERMISSIONS & ROLE MATRIX
  // ===========================================================================

  async getPermissionCatalogue(): Promise<PermissionGroupDto[]> {
    const res = await apiClient.get<ApiResponse<PermissionGroupDto[]>>(
      API_ENDPOINTS.LABORATORY.PERMISSIONS_CATALOGUE
    );
    return res.data.data!;
  },

  async getRolePermissions(): Promise<
    { role: LaboratoryStaffRole; permissions: LaboratoryPermission[] }[]
  > {
    const res = await apiClient.get<
      ApiResponse<{ role: LaboratoryStaffRole; permissions: LaboratoryPermission[] }[]>
    >(API_ENDPOINTS.LABORATORY.PERMISSIONS_ROLES);
    return res.data.data!;
  },

  // ===========================================================================
  // 3. DEPARTMENTS
  // ===========================================================================

  async listDepartments(): Promise<LaboratoryDepartmentDto[]> {
    const res = await apiClient.get<ApiResponse<LaboratoryDepartmentDto[]>>(
      API_ENDPOINTS.LABORATORY.DEPARTMENTS
    );
    return res.data.data!;
  },

  async createDepartment(dto: CreateDepartmentDto): Promise<LaboratoryDepartmentDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryDepartmentDto>>(
      API_ENDPOINTS.LABORATORY.DEPARTMENTS,
      dto
    );
    return res.data.data!;
  },

  async getDepartmentById(id: string): Promise<LaboratoryDepartmentDto> {
    const res = await apiClient.get<ApiResponse<LaboratoryDepartmentDto>>(
      API_ENDPOINTS.LABORATORY.DEPARTMENT_DETAIL(id)
    );
    return res.data.data!;
  },

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto
  ): Promise<LaboratoryDepartmentDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryDepartmentDto>>(
      API_ENDPOINTS.LABORATORY.DEPARTMENT_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  // ===========================================================================
  // 4. SHIFT SCHEDULING & SWAPS
  // ===========================================================================

  async listShiftTemplates(): Promise<LaboratoryShiftTemplateDto[]> {
    const res = await apiClient.get<ApiResponse<LaboratoryShiftTemplateDto[]>>(
      API_ENDPOINTS.LABORATORY.SHIFT_TEMPLATES
    );
    return res.data.data!;
  },

  async createShiftTemplate(dto: CreateShiftTemplateDto): Promise<LaboratoryShiftTemplateDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryShiftTemplateDto>>(
      API_ENDPOINTS.LABORATORY.SHIFT_TEMPLATES,
      dto
    );
    return res.data.data!;
  },

  async updateShiftTemplate(
    id: string,
    dto: UpdateShiftTemplateDto
  ): Promise<LaboratoryShiftTemplateDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryShiftTemplateDto>>(
      API_ENDPOINTS.LABORATORY.SHIFT_TEMPLATE_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  async listShifts(params?: ShiftFilterDto): Promise<LaboratoryShiftAssignmentDto[]> {
    const res = await apiClient.get<ApiResponse<LaboratoryShiftAssignmentDto[]>>(
      API_ENDPOINTS.LABORATORY.SHIFTS,
      { params }
    );
    return res.data.data!;
  },

  async assignShift(dto: AssignShiftDto): Promise<LaboratoryShiftAssignmentDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryShiftAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.SHIFTS,
      dto
    );
    return res.data.data!;
  },

  async batchAssignShifts(dto: BatchAssignShiftDto): Promise<LaboratoryShiftAssignmentDto[]> {
    const res = await apiClient.post<ApiResponse<LaboratoryShiftAssignmentDto[]>>(
      API_ENDPOINTS.LABORATORY.SHIFTS_BATCH,
      dto
    );
    return res.data.data!;
  },

  async updateShiftAssignment(
    id: string,
    dto: UpdateShiftAssignmentDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryShiftAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.SHIFT_DETAIL(id),
      dto
    );
    return res.data.data!;
  },

  async requestShiftSwap(
    id: string,
    dto: RequestShiftSwapDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryShiftAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.SHIFT_SWAP_REQUEST(id),
      dto
    );
    return res.data.data!;
  },

  async reviewShiftSwap(
    id: string,
    dto: ReviewShiftSwapDto
  ): Promise<LaboratoryShiftAssignmentDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryShiftAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.SHIFT_SWAP_REVIEW(id),
      dto
    );
    return res.data.data!;
  },

  // ===========================================================================
  // 5. AVAILABILITY & LEAVE MANAGEMENT
  // ===========================================================================

  async getStaffAvailability(staffId: string): Promise<LaboratoryStaffAvailabilityDto> {
    const res = await apiClient.get<ApiResponse<LaboratoryStaffAvailabilityDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_AVAILABILITY(staffId)
    );
    return res.data.data!;
  },

  async updateStaffAvailability(
    staffId: string,
    dto: UpdateStaffAvailabilityDto
  ): Promise<LaboratoryStaffAvailabilityDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryStaffAvailabilityDto>>(
      API_ENDPOINTS.LABORATORY.STAFF_AVAILABILITY(staffId),
      dto
    );
    return res.data.data!;
  },

  async listLeaveRequests(params?: LeaveFilterDto): Promise<LaboratoryLeaveRequestDto[]> {
    const res = await apiClient.get<ApiResponse<LaboratoryLeaveRequestDto[]>>(
      API_ENDPOINTS.LABORATORY.LEAVE_REQUESTS,
      { params }
    );
    return res.data.data!;
  },

  async submitLeaveRequest(dto: CreateLeaveRequestDto): Promise<LaboratoryLeaveRequestDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryLeaveRequestDto>>(
      API_ENDPOINTS.LABORATORY.LEAVE_REQUESTS,
      dto
    );
    return res.data.data!;
  },

  async reviewLeaveRequest(
    id: string,
    dto: ReviewLeaveRequestDto
  ): Promise<LaboratoryLeaveRequestDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryLeaveRequestDto>>(
      API_ENDPOINTS.LABORATORY.LEAVE_REQUEST_REVIEW(id),
      dto
    );
    return res.data.data!;
  },

  // ===========================================================================
  // 6. WORKLOAD ALLOCATION & DASHBOARD
  // ===========================================================================

  async getWorkloadDashboard(): Promise<LaboratoryWorkloadDashboardDto> {
    const res = await apiClient.get<ApiResponse<LaboratoryWorkloadDashboardDto>>(
      API_ENDPOINTS.LABORATORY.WORKLOAD_DASHBOARD
    );
    return res.data.data!;
  },

  async listTasks(
    params?: TaskFilterDto
  ): Promise<{
    tasks: LaboratoryTaskAssignmentDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        tasks: LaboratoryTaskAssignmentDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >(API_ENDPOINTS.LABORATORY.WORKLOAD_TASKS, { params });
    return res.data.data!;
  },

  async createTask(dto: CreateTaskAssignmentDto): Promise<LaboratoryTaskAssignmentDto> {
    const res = await apiClient.post<ApiResponse<LaboratoryTaskAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.WORKLOAD_TASKS,
      dto
    );
    return res.data.data!;
  },

  async reassignTask(id: string, dto: ReassignTaskDto): Promise<LaboratoryTaskAssignmentDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryTaskAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.WORKLOAD_TASK_REASSIGN(id),
      dto
    );
    return res.data.data!;
  },

  async updateTaskStatus(
    id: string,
    dto: UpdateTaskStatusDto
  ): Promise<LaboratoryTaskAssignmentDto> {
    const res = await apiClient.put<ApiResponse<LaboratoryTaskAssignmentDto>>(
      API_ENDPOINTS.LABORATORY.WORKLOAD_TASK_STATUS(id),
      dto
    );
    return res.data.data!;
  },
};
