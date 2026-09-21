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

INSERT INTO class VALUES(0, TRUE, 'AP Comp Sci A', 'Mrs. Bryan', 'kbryan@fakeschools.org', '0,1');
INSERT INTO class VALUES(1, TRUE, 'AP Comp Sci B', 'Mrs. Cryan', 'kcryan@fakeschools.org', '2');
INSERT INTO class VALUES(2, TRUE, 'BQ Dpnq Tdj C', 'Mrs. Dszbo', 'kdszbo@fakeschools.org', '');
INSERT INTO class VALUES(3, TRUE, 'CR Eqor Uek D', 'Mrs. Etacp', 'ketacp@fakeschools.org', '3');

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

INSERT INTO assignment VALUES(0, TRUE, 'Excessive Expostulation', 'Type an essay in a Word document', 1790053140000, 'High', '', '', 0);
INSERT INTO assignment VALUES(1, TRUE, 'Incentive Exposition', 'Bullet point outline on paper', 1790114400000, 'Low', 'Finish at leisure', '', 0);
INSERT INTO assignment VALUES(2, TRUE, 'Expensive Exfoliation', 'Multiple choice quiz', 1790139540000, 'Inescapable', 'Worth 20% of final grade', '', 1);
INSERT INTO assignment VALUES(3, TRUE, 'Intensive Explanation', 'Lecture recording', 1790139540000, 'Unavoidable', 'Explains 10.1-10.3', '', 3);

COMMIT;