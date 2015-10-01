@echo off

rem ensure node.js and sqlite3 are in %path%
rem change the below command to refer to your node.js path (unless it is already present)
set path=./node_js;../node_js;../../node_js;../../node_js;%path%

where /q node || echo node.js not found! && goto :error

rem ensure required npm modules are present, e.g. sqlite3

rem start the server
node scripts/server.js

pause
goto :EOF

:error
echo Failed with error #%errorlevel%.
pause
exit /b %errorlevel%