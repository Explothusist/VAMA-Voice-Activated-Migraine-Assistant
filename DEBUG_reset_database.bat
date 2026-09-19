@echo off
setlocal
REM echo off - don't print to console, setlocal - push var state

:PROMPT
REM :prompt - GOTO label for later use
echo Do not run this script unless you understand what it does.
SET /P AREYOUSURE=Are you sure you want to reset the database? (Y/[N]) 
REM /P - prompt, set variable AREYOUSURE to whatever the usertypes
IF /I "%AREYOUSURE%" NEQ "Y" GOTO END
REM /I - ignore case, NEQ - not equal, GOTO END - jump to label END

REM echo on - print to console, endlocal - pop var state
endlocal
@echo on

cd db
del main.db
del main.db-shm
del main.db-wal
sqlite3 main.db ".read init.sql"
cd ..

:END