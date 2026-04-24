/**
 * Role Guard Utility — Centralized RBAC for CarePlus
 *
 * Usage:
 *   import { can, ROLES } from '../utils/roleGuard';
 *
 *   // Conditional render
 *   {can(user, 'cancel_any_appointment') && <Button>Cancel</Button>}
 *
 *   // Programmatic guard (e.g., before an API call)
 *   if (!can(user, 'view_all_patients')) { notify.error('Access denied'); return; }
 *
 * Design: Permission-per-ability map — adding a new role or new
 * permission requires ONLY adding one entry here. Zero changes elsewhere.
 */

export const ROLES = {
  ADMIN:        'admin',
  DOCTOR:       'doctor',
  PATIENT:      'patient',
  RECEPTIONIST: 'receptionist',
};

// ─── PERMISSION DEFINITIONS ───────────────────────────────────────────────────
// Each key is an ability string. Values are arrays of roles that have it.
const PERMISSIONS = {
  // ── Appointments ──────────────────────────────────────────────────────────
  view_own_appointments:    [ROLES.PATIENT, ROLES.DOCTOR],
  view_all_appointments:    [ROLES.ADMIN, ROLES.RECEPTIONIST],
  create_appointment:       [ROLES.PATIENT, ROLES.RECEPTIONIST],
  cancel_own_appointment:   [ROLES.PATIENT],
  cancel_any_appointment:   [ROLES.ADMIN, ROLES.RECEPTIONIST],
  update_appointment_status:[ROLES.DOCTOR, ROLES.ADMIN],
  assign_doctor:            [ROLES.RECEPTIONIST, ROLES.ADMIN],

  // ── Patients ──────────────────────────────────────────────────────────────
  view_own_medical_records: [ROLES.PATIENT],
  view_patient_records:     [ROLES.DOCTOR, ROLES.ADMIN],
  register_patient:         [ROLES.RECEPTIONIST, ROLES.ADMIN],
  view_all_patients:        [ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR],

  // ── Doctors ───────────────────────────────────────────────────────────────
  manage_doctors:           [ROLES.ADMIN],
  view_doctor_schedule:     [ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST],
  add_clinical_notes:       [ROLES.DOCTOR],
  write_prescription:       [ROLES.DOCTOR],

  // ── Administration ────────────────────────────────────────────────────────
  manage_users:             [ROLES.ADMIN],
  manage_clinics:           [ROLES.ADMIN],
  view_analytics:           [ROLES.ADMIN],
  invite_staff:             [ROLES.ADMIN],

  // ── Chatbot ───────────────────────────────────────────────────────────────
  use_ai_assistant:         [ROLES.PATIENT],
};

/**
 * Check if a user has a specific permission.
 * @param {object|null} user   — User object with a `role` string field
 * @param {string}      ability — Permission key from PERMISSIONS map
 * @returns {boolean}
 */
export function can(user, ability) {
  if (!user || !user.role) return false;
  const allowedRoles = PERMISSIONS[ability];
  if (!allowedRoles) {
    console.warn(`[RoleGuard] Unknown permission requested: "${ability}"`);
    return false;
  }
  return allowedRoles.includes(user.role);
}

/**
 * Assert permission — throws if denied.
 * Useful before critical async operations.
 * @throws {Error} with code 'ACCESS_DENIED'
 */
export function assert(user, ability) {
  if (!can(user, ability)) {
    const err = new Error(`Access denied: role "${user?.role}" cannot perform "${ability}"`);
    err.code = 'ACCESS_DENIED';
    throw err;
  }
}

/**
 * Get the home path for a given role.
 * Used for post-login redirects.
 */
export function getHomePath(role) {
  const paths = {
    [ROLES.ADMIN]:        '/admin',
    [ROLES.DOCTOR]:       '/doctor',
    [ROLES.PATIENT]:      '/patient',
    [ROLES.RECEPTIONIST]: '/reception',
  };
  return paths[role] || '/login';
}

/**
 * React helper: wrap a component so it only renders for allowed roles.
 * Usage:  <RoleGate user={user} ability="manage_users"><AdminPanel /></RoleGate>
 */
export function RoleGate({ user, ability, fallback = null, children }) {
  return can(user, ability) ? children : fallback;
}
