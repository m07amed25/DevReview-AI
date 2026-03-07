#!/bin/bash

# Rate Limiter Test Script
# Usage: ./test-rate-limit.sh [BASE_URL] [NUM_REQUESTS]
# Example: ./test-rate-limit.sh http://localhost:3000 110

BASE_URL="${1:-http://localhost:3000}"
NUM_REQUESTS="${2:-110}"
ENDPOINT="/api/trpc/repository.list"

echo "=========================================="
echo "Rate Limiter Test Script"
echo "=========================================="
echo "Target: $BASE_URL$ENDPOINT"
echo "Requests to send: $NUM_REQUESTS"
echo ""

# Function to send a request and show response
send_request() {
    local count=$1
    local response=$(curl -s -w "\n%{http_code}" \
        -H "Content-Type: application/json" \
        -H "trpc-force-error: true" \
        "$BASE_URL$ENDPOINT" 2>/dev/null)
    
    local http_code=$(echo "$response" | tail -n1)
    local headers=$(curl -sI \
        -H "Content-Type: application/json" \
        "$BASE_URL$ENDPOINT" 2>/dev/null)
    
    echo "$http_code"
}

echo "Starting rate limit test..."
echo "Sending $NUM_REQUESTS requests to test rate limiting"
echo ""

# Track success/failure
success_count=0
rate_limited=0

for i in $(seq 1 $NUM_REQUESTS); do
    http_code=$(send_request $i)
    
    if [ "$http_code" = "200" ]; then
        success_count=$((success_count + 1))
        if [ $((i % 10)) -eq 0 ]; then
            echo "Request $i: OK (200)"
        fi
    elif [ "$http_code" = "429" ]; then
        rate_limited=$((rate_limited + 1))
        echo "Request $i: RATE LIMITED (429) ✓"
        
        # Get Retry-After header
        retry_after=$(curl -sI \
            -H "Content-Type: application/json" \
            "$BASE_URL$ENDPOINT" 2>/dev/null | grep -i "retry-after" | cut -d' ' -f2)
        
        if [ -n "$retry_after" ]; then
            echo "  → Retry-After: $retry_after seconds"
        fi
    else
        echo "Request $i: HTTP $http_code"
    fi
    
    # Small delay to prevent overwhelming the server
    sleep 0.05
done

echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo "Successful requests: $success_count"
echo "Rate limited (429):  $rate_limited"
echo ""

if [ $rate_limited -gt 0 ]; then
    echo "✓ Rate limiting is WORKING!"
    echo "  The server started rejecting requests after the limit was reached."
else
    echo "⚠ Rate limiting may not be working"
    echo "  No 429 responses received. Possible reasons:"
    echo "  - Running on localhost (whitelisted)"
    echo "  - Rate limiter not enabled"
    echo "  - Need more requests to trigger limit"
fi

echo ""
echo "Testing rate limit headers..."
echo ""

# Get rate limit headers from a fresh request
headers=$(curl -sI \
    -H "Content-Type: application/json" \
    "$BASE_URL$ENDPOINT" 2>/dev/null)

echo "Rate Limit Headers:"
echo "$headers" | grep -i "x-ratelimit\|retry-after" || echo "No rate limit headers found"

echo ""
echo "Test complete!"
