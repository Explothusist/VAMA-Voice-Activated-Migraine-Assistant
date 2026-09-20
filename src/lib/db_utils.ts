
export interface JSONUser {
    id: number;
    active: boolean;
    name: string;
    username: string;
    password: string;
    class_id_list: number[];
}
export interface JSONClass {
    id: number;
    active: boolean;
    name: string;
    teacher_name: string;
    teacher_email: string;
    assignment_id_list: number[];
}
export interface JSONAssignment {
    id: number;
    active: boolean;
    name: string;
    due_date: number;
    priority: string;
    notes: string;
    document_filename: string;
    class_id: number;
}
