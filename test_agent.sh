#!/bin/bash
node agent/index.js &
PID=$!

# Wait for startup and first mock task
sleep 2

# Let it poll and accept task (30s cycle)
sleep 35

# Kill the process
kill $PID 2>/dev/null
wait $PID 2>/dev/null
