// CourseDto.ts
export interface CourseDto {
    id: number;
    name: string;
    description: string;
    requirements: any;
    coverImage?: Buffer | null;
    courseObjectives: any;
    targetLearners?: any | null;
    courseDuration: any;
    assessmentMethods?: any | null;
    status: number;
    creatorId: number;
    lastEditor: number;
    createdAt: Date;
    updatedAt: Date;
    categories: {
        id: number;
        name: string;
    }[];
}
