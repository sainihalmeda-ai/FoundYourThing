/** Shared client-side form validators for FoundYourThing screens. */

export type FieldErrors = Record<string, string>;

/** Students carry a VTU number, staff a TTS number. Nobody else belongs here. */
const CAMPUS_ID = /^(VTU|TTS)[A-Z0-9]{3,17}$/;

const CAMPUS_ID_ERROR =
  "Use your college ID: VTU number for students, TTS number for staff.";

const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
]);

export function isCampusId(value: string): boolean {
  return CAMPUS_ID.test(value.trim().toUpperCase());
}

export function isStudentId(value: string): boolean {
  return value.trim().toUpperCase().startsWith("VTU");
}

/**
 * Students: {VTUid}@….edu.in
 * Faculty:  {name}{staffNumber}@….edu.in
 */
export function validateCampusEmail(email: string, campusId: string): string | null {
  const raw = email.trim();
  if (!raw) return "College email is required.";

  const at = raw.indexOf("@");
  if (at < 1) return "Enter a valid college email.";
  const local = raw.slice(0, at).toLowerCase();
  const domain = raw.slice(at + 1).toLowerCase();

  if (PERSONAL_DOMAINS.has(domain) || !domain.endsWith(".edu.in")) {
    return "Use your college email ending in .edu.in (Gmail and personal mail are not allowed).";
  }
  if (!/^[^\s@]+@[^\s@]+\.edu\.in$/i.test(raw)) {
    return "Use your college email ending in .edu.in.";
  }

  const cid = campusId.trim().toUpperCase();
  const tail = cid.replace(/^(VTU|TTS)/, "");

  if (isStudentId(cid)) {
    const compact = local.replace(/[._-]/g, "");
    if (compact !== cid.toLowerCase() && compact !== `vtu${tail.toLowerCase()}`) {
      return `Student email must be your VTU ID, e.g. ${cid.toLower()}@college.edu.in`;
    }
    return null;
  }

  // Faculty / staff
  if (!/^[a-z][a-z._-]*\d{3,}$/.test(local)) {
    return `Faculty email must be your name followed by your staff number, e.g. nihal${tail.toLower()}@college.edu.in`;
  }
  if (!local.endsWith(tail.toLowerCase())) {
    return `Faculty email must end with your staff number (${tail}), e.g. name${tail.toLower()}@college.edu.in`;
  }
  return null;
}

export function validateLogin(vtuId: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!vtuId.trim()) {
    errors.vtuId = "College ID is required.";
  } else if (!isCampusId(vtuId)) {
    errors.vtuId = CAMPUS_ID_ERROR;
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

export function validateRegister(form: {
  vtu_id: string;
  full_name: string;
  department: string;
  email: string;
  phone: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.vtu_id.trim()) {
    errors.vtu_id = "College ID is required.";
  } else if (!isCampusId(form.vtu_id)) {
    errors.vtu_id = CAMPUS_ID_ERROR;
  }
  if (!form.full_name.trim()) errors.full_name = "Full name is required.";
  if (!form.department.trim()) errors.department = "Department is required.";
  const emailError = validateCampusEmail(form.email, form.vtu_id);
  if (emailError) errors.email = emailError;
  if (!form.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = "Enter a 10-digit mobile number.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

export function validateReport(form: {
  title: string;
  description: string;
  category: string;
  location: string;
  hasPhoto: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.hasPhoto) errors.photo = "Take a clear photo of the valuable item.";
  if (!form.category) errors.category = "Select a category.";
  if (!form.title.trim()) {
    errors.title = "Title is required.";
  } else if (form.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }
  if (!form.description.trim()) {
    errors.description = "Add a few details to help matching.";
  } else if (form.description.trim().length < 8) {
    errors.description = "Add a bit more detail (at least 8 characters).";
  }
  if (!form.location) errors.location = "Select a location.";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
