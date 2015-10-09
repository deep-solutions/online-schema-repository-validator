@echo off

rem ensure node.js is in %path%
rem echo "path is %path%"

where /q node || echo node.js not found! && goto :find_node

:found_node
rem ensure required npm modules are present
rem start the server
node server.js

pause
goto :EOF

:find_node
if exist "D:\software\node_js" (
    set path=../../node_js;%path%
    echo "Adding ../../node_js to path hoping it contains node.exe"
) else (
    goto :error
)
goto :found_node

:error
echo Failed with error #%errorlevel%.
pause
exit /b %errorlevel%