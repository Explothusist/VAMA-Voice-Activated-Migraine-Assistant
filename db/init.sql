PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE user(
    id INTEGER PRIMARY KEY NOT NULL,
    active BOOLEAN,
    name TEXT,
    username TEXT,
    password TEXT,
    class_id_list TEXT
);

INSERT INTO user VALUES(0, TRUE, 'Logan Greggs', 'lgreggs', 'I@mAMa1hAndC0mpSc1Major', '0,1,2,3');

CREATE TABLE class(
    id INTEGER PRIMARY KEY NOT NULL,
    active BOOLEAN,
    name TEXT,
    teacher_name TEXT,
    teacher_email TEXT,
    assignment_id_list TEXT
);

INSERT INTO class VALUES(0, TRUE, 'Calculus 2', 'Mrs. Bryan', 'kbryan@fakeschools.org', '0,1');
INSERT INTO class VALUES(1, TRUE, 'English Literature', 'Mrs. Bell', 'bell@fakeschools.org', '2');
INSERT INTO class VALUES(2, TRUE, 'Fundamentals of Chemistry', 'Mr. Elliot', 'randall.elliot@fakeschools.org', '');
INSERT INTO class VALUES(3, TRUE, 'Microeconomics', 'Dr. B', 'drb@fakeschools.org', '3');

CREATE TABLE assignment(
    id INTEGER PRIMARY KEY NOT NULL,
    active BOOLEAN,
    name TEXT,
    description TEXT,
    due_date INTEGER,
    priority TEXT,
    notes TEXT,
    document_filename TEXT,
    class_id INTEGER
);

INSERT INTO assignment VALUES(0, TRUE, 'Shell Method HW', '', 1790053140000, 'High', '', '', 0);
INSERT INTO assignment VALUES(1, TRUE, 'U-Substitution Quiz', '', 1790114400000, 'Low', 'Finish at leisure', '', 0);
INSERT INTO assignment VALUES(2, TRUE, 'Stoichiometry Practice', '', 1790139540000, 'Inescapable', 'Worth 20% of final grade', '', 1);
INSERT INTO assignment VALUES(3, TRUE, 'Tarrifs Reading', '', 1790139540000, 'Unavoidable', 'Explains 10.1-10.3', '', 3);

COMMIT;