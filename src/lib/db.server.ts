import Database from 'better-sqlite3';
import type { JSONAssignment, JSONClass, JSONUser } from './db_utils';
export const db = new Database("db/main.db", {});
db.pragma("journal_mode = WAL");


interface UserCSVRow {
    id: number;
    active: boolean;
    name: string;
    username: string;
    password: string;
    class_id_list: string;
}
interface UserDataObject {
    id: number;
    active: boolean;
    name: string;
    username: string;
    password: string;
    class_id_list: number[];
}
export class User {
    id: number;
    active: boolean;
    name: string;
    username: string;
    password: string;
    class_id_list: number[];

    constructor(data: UserDataObject) {
        this.id = data.id;
        this.active = data.active;
        this.name = data.name;
        this.username = data.username;
        this.password = data.password;
        this.class_id_list = data.class_id_list;
    }
    static readonly SQLGet_BaseFields = "SELECT id,active,name,username,password,class_id_list FROM user";

    static fromCSV(csv_data: UserCSVRow): User {
        let data: UserDataObject = {
            id: csv_data.id,
            active: csv_data.active,
            name: csv_data.name,
            username: csv_data.username,
            password: csv_data.password,
            class_id_list: csv_data.class_id_list.split(",").map((a) => Number(a)),
        };
        return new User(data);
    }

    static GetAllQuery = db.prepare<[], UserCSVRow>(User.SQLGet_BaseFields);
    static getAll(): User[] {
        const rows: UserCSVRow[] = User.GetAllQuery.all();
        return rows.map((a) => User.fromCSV(a));
    }

    static GetByIdQuery = db.prepare<[], UserCSVRow>(User.SQLGet_BaseFields+" WHERE id = ?");
    static getById(id: number): User {
        const row: (UserCSVRow | undefined) = User.GetByIdQuery.get();
        return row ? User.fromCSV(row) : User.errorCode();
    }

    static readonly ERROR = Object.freeze(new User({
        id: -1,
        active: true,
        name: "",
        username: "",
        password: "",
        class_id_list: [],
    }));
    static errorCode(): User {
        return User.ERROR;
    }

    toJSON(): JSONUser {
        const out = {...this};
        return out;
    }

}

interface ClassCSVRow {
    id: number;
    active: boolean;
    name: string;
    teacher_name: string;
    teacher_email: string;
    assignment_id_list: string;
}
interface ClassDataObject {
    id: number;
    active: boolean;
    name: string;
    teacher_name: string;
    teacher_email: string;
    assignment_id_list: number[];
}
export class Class {
    id: number;
    active: boolean;
    name: string;
    teacher_name: string;
    teacher_email: string;
    assignment_id_list: number[];

    constructor(data: ClassDataObject) {
        this.id = data.id;
        this.active = data.active;
        this.name = data.name;
        this.teacher_name = data.teacher_name;
        this.teacher_email = data.teacher_email;
        this.assignment_id_list = data.assignment_id_list;
    }
    static readonly SQLGet_BaseFields = "SELECT id,active,name,teacher_name,teacher_email,assignment_id_list FROM class";

    static fromCSV(csv_data: ClassCSVRow): Class {
        let data: ClassDataObject = {
            id: csv_data.id,
            active: csv_data.active,
            name: csv_data.name,
            teacher_name: csv_data.teacher_name,
            teacher_email: csv_data.teacher_email,
            assignment_id_list: csv_data.assignment_id_list.split(",").map((a) => Number(a)),
        };
        return new Class(data);
    }

    static GetAllQuery = db.prepare<[], ClassCSVRow>(Class.SQLGet_BaseFields);
    static getAll(): Class[] {
        const rows: ClassCSVRow[] = Class.GetAllQuery.all();
        return rows.map((a) => Class.fromCSV(a));
    }

    static GetByIdQuery = db.prepare<[], ClassCSVRow>(Class.SQLGet_BaseFields+" WHERE id = ?");
    static getById(id: number): Class {
        const row: (ClassCSVRow | undefined) = Class.GetByIdQuery.get();
        return row ? Class.fromCSV(row) : Class.errorCode();
    }

    static readonly ERROR = Object.freeze(new Class({
        id: -1,
        active: true,
        name: "",
        teacher_name: "",
        teacher_email: "",
        assignment_id_list: [],
    }));
    static errorCode(): Class {
        return Class.ERROR;
    }

    toJSON(): JSONClass {
        const out = {...this};
        return out;
    }

}

interface AssignmentCSVRow {
    id: number;
    active: boolean;
    name: string;
    due_date: number;
    priority: string;
    notes: string;
    document_filename: string;
    class_id: number;
}
interface AssignmentDataObject {
    id: number;
    active: boolean;
    name: string;
    due_date: number;
    priority: string;
    notes: string;
    document_filename: string;
    class_id: number;
}
export class Assignment {
    id: number;
    active: boolean;
    name: string;
    due_date: number;
    priority: string;
    notes: string;
    document_filename: string;
    class_id: number;

    constructor(data: AssignmentDataObject) {
        this.id = data.id;
        this.active = data.active;
        this.name = data.name;
        this.due_date = data.due_date;
        this.priority = data.priority;
        this.notes = data.notes;
        this.document_filename = data.document_filename;
        this.class_id = data.class_id;
    }
    static readonly SQLGet_BaseFields = "SELECT id,active,name,description,due_date,priority,notes,document_filename,class_id FROM Assignment";

    static fromCSV(csv_data: AssignmentCSVRow): Assignment {
        let data: AssignmentDataObject = {
            id: csv_data.id,
            active: csv_data.active,
            name: csv_data.name,
            due_date: csv_data.due_date,
            priority: csv_data.priority,
            notes: csv_data.notes,
            document_filename: csv_data.document_filename,
            class_id: csv_data.class_id,
        };
        return new Assignment(data);
    }

    static GetAllQuery = db.prepare<[], AssignmentCSVRow>(Assignment.SQLGet_BaseFields);
    static getAll(): Assignment[] {
        const rows: AssignmentCSVRow[] = Assignment.GetAllQuery.all();
        return rows.map((a) => Assignment.fromCSV(a));
    }

    static GetByIdQuery = db.prepare<[], AssignmentCSVRow>(Assignment.SQLGet_BaseFields+" WHERE id = ?");
    static getById(id: number): Assignment {
        const row: (AssignmentCSVRow | undefined) = Assignment.GetByIdQuery.get();
        return row ? Assignment.fromCSV(row) : Assignment.errorCode();
    }

    static readonly ERROR = Object.freeze(new Assignment({
        id: -1,
        active: true,
        name: "",
        due_date: 0,
        priority: "",
        notes: "",
        document_filename: "",
        class_id: -1,
    }));
    static errorCode(): Assignment {
        return Assignment.ERROR;
    }

    toJSON(): JSONAssignment {
        const out = {...this};
        return out;
    }

}