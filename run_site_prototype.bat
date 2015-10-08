@echo off

rem ensure node.js is in %path%
rem change the below command to refer to your node.js path (unless it is already present)
if exist ../../node_js set path="%path%;../../node_js"

rem echo "path is %path%"

where /q node || echo node.js not found! && goto :error

rem ensure required npm modules are present

rem start the server
node server.js

pause
goto :EOF

:error
echo Failed with error #%errorlevel%.
pause
exit /b %errorlevel%