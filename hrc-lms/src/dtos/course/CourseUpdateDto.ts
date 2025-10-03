// CourseUpdateDto.ts
export interface CourseUpdateDto {
    name?: string;
    description?: string;
    requirements?: any;
    coverImage?: Buffer | null;
    courseObjectives?: any;
    targetLearners?: any | null;
    courseDuration?: any;
    assessmentMethods?: any | null;
    status?: number;
    lastEditor?: number;
    categories?: number[]; // cập nhật category
}
