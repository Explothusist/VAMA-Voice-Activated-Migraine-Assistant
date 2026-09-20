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

INSERT INTO user VALUES(0, TRUE, "Logan Greggs", "lgreggs", "I@mAMa1hAndC0mpSc1Major", "0,1,2,3");

CREATE TABLE class(
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT,
    teacher_name TEXT,
    teacher_email TEXT,
    assigment_id_list TEXT
);

INSERT INTO user VALUES(0, "AP Comp Sci A", "Mrs. Bryan", "kbryan@fakeschools.org", "0,1");
INSERT INTO user VALUES(1, "AP Comp Sci B", "Mrs. Cryan", "kcryan@fakeschools.org", "2");
INSERT INTO user VALUES(2, "BQ Dpnq Tdj C", "Mrs. Dszbo", "kdszbo@fakeschools.org", "");
INSERT INTO user VALUES(3, "CR Eqor Uek D", "Mrs. Etacp", "ketacp@fakeschools.org", "3");

CREATE TABLE assignments(
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT,
    description TEXT,
    due_date INTEGER,
    priority TEXT,
    notes TEXT,
    document_filename TEXT,
    class_id INTEGER
);

INSERT INTO user VALUES(0, "Excessive Expostulation", "Type an essay in a Word document", 0, "High", "", 0);
INSERT INTO user VALUES(1, "Incentive Exposition", "Bullet point outline on paper", 0, "Low", "Finish at leisure", 0);
INSERT INTO user VALUES(2, "Expensive Exfoliation", "Multiple choice quiz", 0, "Inescapable", "Worth 20% of final grade", 1);
INSERT INTO user VALUES(3, "Intensive Explanation", "Lecture recording", 0, "Unavoidable", "Explains 10.1-10.3", 3);

COMMIT;