#!/bin/bash

# E2E Quiz Testing Runner Script
# This script provides convenient commands for running the quiz E2E tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}     E2E Quiz Testing Suite Runner${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

print_section() {
    echo -e "${YELLOW}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if development server is running
check_dev_server() {
    print_section "Checking development server..."
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Development server is running on port 3000"
        return 0
    else
        print_error "Development server is not running on port 3000"
        echo "Please start the development server with: npm run dev"
        return 1
    fi
}

# Install dependencies if needed
check_dependencies() {
    print_section "Checking dependencies..."
    
    if [ ! -d "node_modules" ]; then
        print_section "Installing dependencies..."
        npm install
    fi
    
    # Check if Playwright is installed
    if [ ! -d "node_modules/@playwright" ]; then
        print_section "Installing Playwright..."
        npm install @playwright/test
    fi
    
    # Install browsers if needed
    print_section "Checking Playwright browsers..."
    npx playwright install
    
    print_success "Dependencies are ready"
}

# Run specific test suite
run_quiz_lifecycle_tests() {
    print_section "Running Quiz Lifecycle E2E Tests..."
    echo ""
    
    echo -e "${BLUE}📋 Test Suite Overview:${NC}"
    echo "• Day 1: Quiz Initiation Flow"
    echo "• Day 2: Click-Based Questions (Single, Multi, Yes/No)"
    echo "• Day 3: Complex Questions (Order, Drag-Drop, Dropdown)"
    echo "• Day 4: Navigation and Final Questions"
    echo "• Day 5: Submission and Completion Flow"
    echo ""
    
    npx playwright test quiz-lifecycle --reporter=line
    
    if [ $? -eq 0 ]; then
        print_success "Quiz Lifecycle Tests Passed!"
    else
        print_error "Quiz Lifecycle Tests Failed!"
        return 1
    fi
}

# Run Page Object Model tests
run_pom_tests() {
    print_section "Running Page Object Model Tests..."
    echo ""
    
    npx playwright test quiz-lifecycle-pom --reporter=line
    
    if [ $? -eq 0 ]; then
        print_success "Page Object Model Tests Passed!"
    else
        print_error "Page Object Model Tests Failed!"
        return 1
    fi
}

# Run all E2E tests
run_all_tests() {
    print_section "Running All E2E Tests..."
    echo ""
    
    npx playwright test tests/e2e/ --reporter=html
    
    if [ $? -eq 0 ]; then
        print_success "All E2E Tests Passed!"
        echo ""
        echo -e "${BLUE}📊 Test Report:${NC}"
        echo "HTML report generated: playwright-report/index.html"
        echo "To view: npx playwright show-report"
    else
        print_error "Some E2E Tests Failed!"
        return 1
    fi
}

# Debug mode with UI
run_debug_mode() {
    print_section "Running Tests in Debug Mode (UI)..."
    echo ""
    
    npx playwright test quiz-lifecycle --ui
}

# Headed mode (visible browser)
run_headed_mode() {
    print_section "Running Tests in Headed Mode (Visible Browser)..."
    echo ""
    
    npx playwright test quiz-lifecycle --headed
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  lifecycle    Run the main quiz lifecycle tests"
    echo "  pom         Run Page Object Model tests"
    echo "  all         Run all E2E tests with HTML report"
    echo "  debug       Run tests in debug mode (Playwright UI)"
    echo "  headed      Run tests with visible browser"
    echo "  check       Check dependencies and dev server"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 lifecycle    # Run main test suite"
    echo "  $0 debug       # Debug tests with UI"
    echo "  $0 all         # Run all tests with report"
}

# Main script logic
main() {
    print_header
    
    case "${1:-}" in
        "lifecycle")
            check_dependencies
            check_dev_server || exit 1
            run_quiz_lifecycle_tests
            ;;
        "pom")
            check_dependencies
            check_dev_server || exit 1
            run_pom_tests
            ;;
        "all")
            check_dependencies
            check_dev_server || exit 1
            run_all_tests
            ;;
        "debug")
            check_dependencies
            check_dev_server || exit 1
            run_debug_mode
            ;;
        "headed")
            check_dependencies
            check_dev_server || exit 1
            run_headed_mode
            ;;
        "check")
            check_dependencies
            check_dev_server
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        "")
            echo -e "${YELLOW}No command specified. Running default quiz lifecycle tests...${NC}"
            echo ""
            check_dependencies
            check_dev_server || exit 1
            run_quiz_lifecycle_tests
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
