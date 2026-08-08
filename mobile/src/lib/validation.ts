/** Shared client-side form validators for FoundYourThing screens. */

export type FieldErrors = Record<string, string>;

/** Students carry a VTU number, staff a TTS number. Nobody else belongs here. */
const CAMPUS_ID = /^(VTU|TTS)[A-Z0-9]{3,17}$/;

const CAMPUS_ID_ERROR =
  "Use your college ID: VTU number for students, TTS number for staff.";

export function isCampusId(value: string): boolean {
  return CAMPUS_ID.test(value.trim().toUpperCase());
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
  if (!form.email.trim()) {
    errors.email = "College email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
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
