import React, { useState, useEffect } from 'react';
import { Student, SchoolClass, FeeRecord, AttendanceRecord, ExamScore, Guardian } from '../types';
import StudentListView from './students/StudentListView';
import StudentAddView from './students/StudentAddView';
import StudentImportView from './students/StudentImportView';
import StudentExportView from './students/StudentExportView';
import StudentProfileModal from './StudentProfileModal';

export type StudentSubSection = 'all' | 'add' | 'active' | 'inactive' | 'archived' | 'import' | 'export';

interface StudentsViewProps {
  students: Student[];
  classes: SchoolClass[];
  fees: FeeRecord[];
  attendance: AttendanceRecord[];
  examScores: ExamScore[];
  subjects?: any[];
  guardians?: Guardian[];
  settings: {
    schoolName: string;
    currency: string;
    academicYear?: string;
    [key: string]: any;
  };
  onAddStudent: (student: any) => Promise<boolean>;
  onUpdateStudent: (id: string, updates: any) => Promise<boolean>;
  onDeleteStudent: (id: string) => Promise<boolean>;
  onBulkUpdate?: (action: string, studentIds: string[], targetValue?: string) => Promise<boolean>;
  onRefreshData?: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
  subSection?: StudentSubSection;
  onNavigateSubSection?: (sub: StudentSubSection) => void;
  selectedStudentProfileId?: string | null;
  onCloseStudentProfile?: () => void;
  onOpenStudentProfile?: (student: Student) => void;
}

export default function StudentsView({
  students,
  classes,
  fees,
  attendance,
  examScores,
  subjects,
  guardians,
  settings,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkUpdate,
  onRefreshData,
  showToast,
  theme = 'dark',
  subSection = 'all',
  onNavigateSubSection,
  selectedStudentProfileId,
  onCloseStudentProfile,
  onOpenStudentProfile
}: StudentsViewProps) {
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Sync selected student if passed from parent/URL
  useEffect(() => {
    if (selectedStudentProfileId) {
      const match = students.find(s => s.id === selectedStudentProfileId);
      if (match) setSelectedStudentForModal(match);
    } else if (selectedStudentProfileId === null) {
      setSelectedStudentForModal(null);
    }
  }, [selectedStudentProfileId, students]);

  const handleOpenProfile = (student: Student) => {
    setSelectedStudentForModal(student);
    if (onOpenStudentProfile) {
      onOpenStudentProfile(student);
    }
  };

  const handleCloseProfile = () => {
    setSelectedStudentForModal(null);
    if (onCloseStudentProfile) {
      onCloseStudentProfile();
    }
  };

  const handleEditStudentFromProfile = (student: Student) => {
    handleCloseProfile();
    setEditingStudentId(student.id);
    navigateTo('all');
  };

  const navigateTo = (sub: StudentSubSection) => {
    if (onNavigateSubSection) {
      onNavigateSubSection(sub);
    }
  };

  return (
    <div className="w-full">
      {/* 1. ADD STUDENT SUB-PAGE */}
      {subSection === 'add' && (
        <StudentAddView
          classes={classes}
          onAddStudent={async (newStudentData) => {
            const success = await onAddStudent(newStudentData);
            if (success) {
              if (onRefreshData) onRefreshData();
              navigateTo('all');
            }
            return success;
          }}
          onCancel={() => navigateTo('all')}
          showToast={showToast}
          theme={theme}
        />
      )}

      {/* 2. IMPORT STUDENTS SUB-PAGE */}
      {subSection === 'import' && (
        <StudentImportView
          existingStudents={students}
          classes={classes}
          onImportStudents={async (importedStudents) => {
            let addedCount = 0;
            for (const s of importedStudents) {
              const ok = await onAddStudent(s);
              if (ok) addedCount++;
            }
            if (onRefreshData) onRefreshData();
            showToast(`${addedCount} arday ayaa si guul leh loo soo galiyey!`, 'success');
            navigateTo('all');
            return true;
          }}
          onCancel={() => navigateTo('all')}
          showToast={showToast}
          theme={theme}
        />
      )}

      {/* 3. EXPORT STUDENTS SUB-PAGE */}
      {subSection === 'export' && (
        <StudentExportView
          students={students}
          classes={classes}
          fees={fees}
          settings={settings}
          onCancel={() => navigateTo('all')}
          showToast={showToast}
          theme={theme}
        />
      )}

      {/* 4. ALL / ACTIVE / INACTIVE / ARCHIVED STUDENTS LIST VIEW */}
      {(subSection === 'all' || subSection === 'active' || subSection === 'inactive' || subSection === 'archived') && (
        <StudentListView
          mode={subSection}
          students={students}
          classes={classes}
          fees={fees}
          attendance={attendance}
          examScores={examScores}
          subjects={subjects}
          settings={settings}
          onAddStudent={onAddStudent}
          onUpdateStudent={onUpdateStudent}
          onDeleteStudent={onDeleteStudent}
          onBulkUpdate={onBulkUpdate}
          onRefreshData={onRefreshData}
          showToast={showToast}
          theme={theme}
          onNavigateSubSection={navigateTo}
          onSelectStudentProfile={handleOpenProfile}
          initialEditingStudentId={editingStudentId}
          onClearEditingStudentId={() => setEditingStudentId(null)}
        />
      )}

      {/* 5. CONTEXTUAL STUDENT PROFILE MODAL */}
      {selectedStudentForModal && (
        <StudentProfileModal
          student={selectedStudentForModal}
          guardian={guardians?.find(g => g.studentIds?.includes(selectedStudentForModal.id))}
          classes={classes}
          attendance={attendance}
          examScores={examScores}
          fees={fees}
          subjects={subjects}
          currency={settings.currency || '$'}
          theme={theme}
          onClose={handleCloseProfile}
          onEditStudent={handleEditStudentFromProfile}
        />
      )}
    </div>
  );
}
