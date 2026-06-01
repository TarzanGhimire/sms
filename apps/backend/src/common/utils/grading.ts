/**
 * Nepali school grading system (NEB-style letter grade + GPA).
 * Grade is derived from the percentage of marks obtained.
 */

export interface GradeResult {
  grade: string;
  gradePoint: number;
}

const GRADE_SCALE: { min: number; grade: string; gradePoint: number }[] = [
  { min: 90, grade: 'A+', gradePoint: 4.0 },
  { min: 80, grade: 'A', gradePoint: 3.6 },
  { min: 70, grade: 'B+', gradePoint: 3.2 },
  { min: 60, grade: 'B', gradePoint: 2.8 },
  { min: 50, grade: 'C+', gradePoint: 2.4 },
  { min: 40, grade: 'C', gradePoint: 2.0 },
  { min: 35, grade: 'D', gradePoint: 1.6 },
  { min: 0, grade: 'NG', gradePoint: 0 },
];

export function calculateGrade(obtained: number, fullMarks: number): GradeResult {
  if (fullMarks <= 0) return { grade: 'NG', gradePoint: 0 };
  const percentage = (obtained / fullMarks) * 100;
  const tier = GRADE_SCALE.find((t) => percentage >= t.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
  return { grade: tier.grade, gradePoint: tier.gradePoint };
}

export function gpaToGrade(gpa: number): string {
  if (gpa >= 3.6) return 'A+';
  if (gpa >= 3.2) return 'A';
  if (gpa >= 2.8) return 'B+';
  if (gpa >= 2.4) return 'B';
  if (gpa >= 2.0) return 'C+';
  if (gpa >= 1.6) return 'C';
  if (gpa >= 0.8) return 'D';
  return 'NG';
}

/** A student passes a subject if they meet the pass mark and are not absent. */
export function isSubjectPass(obtained: number, passMarks: number, isAbsent: boolean): boolean {
  if (isAbsent) return false;
  return obtained >= passMarks;
}
