// CourseCreateDto.ts
export interface CourseCreateDto {
    name: string;
    description: string;
    requirements: any;
    coverImage?: Buffer | null;
    courseObjectives: any;
    targetLearners?: any | null;
    courseDuration: any;
    assessmentMethods?: any | null;
    status?: number;
    creatorId: number;
    lastEditor: number;
    categories: number[]; // mảng categoryId
}
