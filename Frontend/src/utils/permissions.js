// Permission checking utility functions

export const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

export const hasModuleAccess = (user, module) => {
  // Admin users have access to all modules by default
  if (user && user.role === 'admin') {
    return true;
  }
  
  // Teacher users have default access to specific modules
  if (user && user.role === 'teacher') {
    const teacherDefaultModules = ['students', 'subjects', 'classrooms', 'exams', 'enrollments', 'notifications'];
    if (teacherDefaultModules.includes(module)) {
      return true;
    }
  }
  
  const moduleAccessMap = {
    'students': 'access_students',
    'teachers': 'access_teachers',
    'subjects': 'access_subjects',
    'classrooms': 'access_classrooms',
    'enrollments': 'access_enrollments',
    'users': 'access_users',
    'notifications': 'access_notifications',
    'exams': 'access_exams'
  };
  
  const accessPermission = moduleAccessMap[module];
  if (!accessPermission) return false;
  
  return hasPermission(user, accessPermission);
};

export const canCreate = (user, module) => {
  // Admin users can create in all modules
  if (user && user.role === 'admin') {
    return true;
  }
  
  // Teacher users can create in their default modules
  if (user && user.role === 'teacher') {
    const teacherDefaultModules = ['students', 'subjects', 'classrooms', 'exams', 'enrollments'];
    if (teacherDefaultModules.includes(module)) {
      return true;
    }
  }
  
  const createPermissionMap = {
    'students': 'create_student',
    'teachers': 'create_teacher',
    'subjects': 'create_subject',
    'classrooms': 'create_classroom',
    'enrollments': 'create_enrollment',
    'exams': 'create_exam'
  };
  
  const createPermission = createPermissionMap[module];
  if (!createPermission) return false;
  
  return hasPermission(user, createPermission);
};

export const canRead = (user, module) => {
  // Admin users can read all modules
  if (user && user.role === 'admin') {
    return true;
  }
  
  // Teacher users can read their default modules
  if (user && user.role === 'teacher') {
    const teacherDefaultModules = ['students', 'subjects', 'classrooms', 'exams', 'enrollments'];
    if (teacherDefaultModules.includes(module)) {
      return true;
    }
  }
  
  const readPermissionMap = {
    'students': 'read_student',
    'teachers': 'read_teacher',
    'subjects': 'read_subject',
    'classrooms': 'read_classroom',
    'enrollments': 'read_enrollment',
    'exams': 'read_exam'
  };
  
  const readPermission = readPermissionMap[module];
  if (!readPermission) return false;
  
  return hasPermission(user, readPermission);
};

export const canUpdate = (user, module) => {
  // Admin users can update all modules
  if (user && user.role === 'admin') {
    return true;
  }
  
  // Teacher users can update their default modules
  if (user && user.role === 'teacher') {
    const teacherDefaultModules = ['students', 'subjects', 'classrooms', 'exams', 'enrollments'];
    if (teacherDefaultModules.includes(module)) {
      return true;
    }
  }
  
  const updatePermissionMap = {
    'students': 'update_student',
    'teachers': 'update_teacher',
    'subjects': 'update_subject',
    'classrooms': 'update_classroom',
    'enrollments': 'update_enrollment',
    'exams': 'update_exam'
  };
  
  const updatePermission = updatePermissionMap[module];
  if (!updatePermission) return false;
  
  return hasPermission(user, updatePermission);
};

export const canDelete = (user, module) => {
  // Admin users can delete in all modules
  if (user && user.role === 'admin') {
    return true;
  }
  
  // Teacher users can delete in their default modules
  if (user && user.role === 'teacher') {
    const teacherDefaultModules = ['students', 'subjects', 'classrooms', 'exams', 'enrollments'];
    if (teacherDefaultModules.includes(module)) {
      return true;
    }
  }
  
  const deletePermissionMap = {
    'students': 'delete_student',
    'teachers': 'delete_teacher',
    'subjects': 'delete_subject',
    'classrooms': 'delete_classroom',
    'enrollments': 'delete_enrollment',
    'exams': 'delete_exam'
  };
  
  const deletePermission = deletePermissionMap[module];
  if (!deletePermission) return false;
  
  return hasPermission(user, deletePermission);
};

export const canBulkUpload = (user) => {
  // Admin users can always bulk upload
  if (user && user.role === 'admin') {
    return true;
  }
  // Teacher users can bulk upload by default
  if (user && user.role === 'teacher') {
    return true;
  }
  return hasPermission(user, 'bulk_upload');
};

export const canExport = (user) => {
  // Admin users can always export
  if (user && user.role === 'admin') {
    return true;
  }
  // Teacher users can export by default
  if (user && user.role === 'teacher') {
    return true;
  }
  return hasPermission(user, 'export_data');
};

export const canSendNotifications = (user) => {
  // Admin users can always send notifications
  if (user && user.role === 'admin') {
    return true;
  }
  // Teacher users can send notifications by default
  if (user && user.role === 'teacher') {
    return true;
  }
  return hasPermission(user, 'send_notifications');
};

export const canManageUsers = (user) => {
  // Admin users can always manage users
  if (user && user.role === 'admin') {
    return true;
  }
  return hasPermission(user, 'manage_users');
};

// Default permissions for different roles
export const getDefaultPermissions = (role) => {
  switch (role) {
    case 'admin':
      return [
        // Module access
        'access_students', 'access_teachers', 'access_subjects', 'access_classrooms',
        'access_enrollments', 'access_users', 'access_notifications', 'access_exams',
        // CRUD permissions
        'create_student', 'read_student', 'update_student', 'delete_student',
        'create_teacher', 'read_teacher', 'update_teacher', 'delete_teacher',
        'create_subject', 'read_subject', 'update_subject', 'delete_subject',
        'create_classroom', 'read_classroom', 'update_classroom', 'delete_classroom',
        'create_exam', 'read_exam', 'update_exam', 'delete_exam',
        'create_enrollment', 'read_enrollment', 'update_enrollment', 'delete_enrollment',
        // Special permissions
        'assign_invigilator', 'manage_users', 'view_reports', 'bulk_upload',
        'send_notifications', 'export_data'
      ];
    case 'teacher':
      return [
        'read_dashboard', 'read_timetable', 'read_seating'
      ];
    case 'student':
      return [
        'read_dashboard', 'read_timetable', 'read_seating'
      ];
    default:
      return [];
  }
};
