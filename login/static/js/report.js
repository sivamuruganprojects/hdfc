/**
 * Fetches and displays account statement report
 * Handles both HTML display and PDF data preparation
 */
function fetchReport() {
    try {
        // DOM Elements
        const elements = {
            accountType: document.getElementById("accountselect1"),
            accountNumber: document.getElementById("accountno"),
            fromDate: document.getElementById("frmDatePicker"),
            toDate: document.getElementById("toDatePicker"),
            miniStatement: document.getElementById("mini_value"),
            dateRangeDisplay: document.getElementById("date-range-display"),
            fetchReportTable: document.getElementById("fetch_report"),
            pdfStatementTable: document.getElementById("pdf_statement")
        };

        // Validate inputs
        if (!validateInputs(elements)) {
            return;
        }

        // Prepare request data
        const requestData = {
            from_date: elements.fromDate.value,
            to_date: elements.toDate.value,
            username: userData.username,
            userid: userData.userID,
            mini_statement: elements.miniStatement.value,
            csrfmiddlewaretoken: '{{ csrf_token }}'
        };

        // Show loading state
        toggleLoadingState(true);

        // Make API request
        $.ajax({
            url: '/get-updated-report/',
            method: 'POST',
            data: requestData,
            success: (response) => handleSuccessResponse(response, elements),
            error: (xhr) => handleErrorResponse(xhr)
        });

    } catch (error) {
        console.error("Unexpected error in fetchReport:", error);
        alert("An unexpected error occurred. Please try again.");
    }
}

/**
 * Validates form inputs
 * @param {Object} elements - DOM elements to validate
 * @returns {boolean} True if validation passes
 */
function validateInputs(elements) {
    // Validate account selection
    if (!elements.accountType.value || elements.accountType.value === "- Select Type of Account -") {
        alert("Please Select Account Type.");
        return false;
    }

    if (!elements.accountNumber.value || elements.accountNumber.value === "- Select An Account -") {
        alert("Please Select Account Number");
        return false;
    }

    // Validate dates for non-mini statement
    if (elements.miniStatement.value === '0') {
        if (!elements.fromDate.value || !elements.toDate.value) {
            alert("Please select both From Date and To Date.");
            return false;
        }

        // Parse dates for comparison (assuming DD-MM-YYYY format)
        const fromDate = parseDateString(elements.fromDate.value);
        const toDate = parseDateString(elements.toDate.value);

        if (toDate < fromDate) {
            alert("To Date must be later than or equal to From Date.");
            return false;
        }
    }

    return true;
}

/**
 * Parses date string in DD-MM-YYYY format to Date object
 * @param {string} dateString - Date string in DD-MM-YYYY format
 * @returns {Date} Parsed Date object
 */
function parseDateString(dateString) {
    const parts = dateString.split("-");
    return new Date(parts[2], parts[1] - 1, parts[0]); // Year, Month (0-11), Day
}

/**
 * Handles successful API response
 * @param {Object} response - API response data
 * @param {Object} elements - DOM elements to update
 */
function handleSuccessResponse(response, elements) {
    try {
        // Hide loading state
        toggleLoadingState(false);

        // Check for error response
        if (response.status !== 'success') {
            alert(response.message || "Failed to fetch report data");
            return;
        }

        // Update date range display
        updateDateRangeDisplay(response, elements.dateRangeDisplay);

        // Update transaction tables
        updateTransactionTables(response, elements);

    } catch (error) {
        console.error("Error processing response:", error);
        alert("Error processing report data. Please try again.");
    }
}

/**
 * Updates the date range display
 * @param {Object} response - API response
 * @param {HTMLElement} displayElement - Element to update
 */
function updateDateRangeDisplay(response, displayElement) {
    if (response.from_date && response.to_date) {
        //displayElement.innerHTML = `From: ${response.from_date} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To: ${response.to_date}`;
    }
}

/**
 * Updates both HTML and PDF transaction tables
 * @param {Object} response - API response
 * @param {Object} elements - DOM elements
 */
function updateTransactionTables(response, elements) {
    // Clear existing tables
    clearTableRows(elements.fetchReportTable, "tr.account_statements");
    clearTableBody(elements.pdfStatementTable.querySelector("tbody"));

    // Show table if we have data
    if (response.data?.length > 0) {
        elements.fetchReportTable.style.display = "table";
        populateTables(response.data, elements);
    } else {
        alert("No transactions found for the selected date range.");
    }
}

/**
 * Clears all rows from a table except header
 * @param {HTMLElement} table - Table element
 * @param {string} rowSelector - Selector for rows to remove
 */
function clearTableRows(table, rowSelector) {
    const rows = table.querySelectorAll(rowSelector);
    rows.forEach((row, index) => {
        if (index !== 0) row.remove(); // Keep header
    });
}

/**
 * Clears all rows from a table body
 * @param {HTMLElement} tbody - Table body element
 */
function clearTableBody(tbody) {
    tbody.innerHTML = '';
}

/**
 * Populates both HTML and PDF tables with transaction data
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} elements - DOM elements
 */
function populateTables(transactions, elements) {
    transactions.forEach(txn => {
        console.log(transactions)
        // Format transaction data
        const formattedTxn = {
            ...txn,
            displayDate: txn.txn_date,
            pdfDate: txn.txn_date,
            valueDisplayDate: txn.value_date,
            valuePdfDate: txn.value_date,
            formattedWithdrawal: formatCurrency(txn.withdrawal_amt),
            formattedDeposit: formatCurrency(txn.deposit_amt),
            running_balance: txn.running_balance,
        };

        // Add to HTML table
        elements.fetchReportTable.appendChild(createTableRow(formattedTxn, 'html'));

        // Add to PDF table
        elements.pdfStatementTable.querySelector("tbody")
            .appendChild(createTableRow(formattedTxn, 'pdf'));
    });
}

/**
 * Creates a table row for either HTML or PDF display
 * @param {Object} txn - Formatted transaction data
 * @param {string} type - 'html' or 'pdf'
 * @returns {HTMLElement} Table row element
 */
function createTableRow(txn, type) {
    const row = document.createElement('tr');
    if (type === 'html') {
        row.className = 'account_statements';
        row.innerHTML = `
            <td width="11%" style="border-left: 1px solid #ced2df !important;">${txn.displayDate}</td>
            <td width="25%">${txn.narration}</td>
            <td width="18%">${txn.ref_no}</td>
            <td width="10%">${txn.valueDisplayDate}</td>
            <td width="10%">${txn.formattedWithdrawal}</td>
            <td width="10%" class="aligngight">${txn.formattedDeposit}</td>
            <td width="10%" class="aligngight">${txn.running_balance}</td>
        `;
    } else {
        row.innerHTML = `
            <td style="border-left: 1px solid #ced2df !important;">${txn.pdfDate}</td>
            <td>${txn.narration}</td>
            <td>${txn.ref_no}</td>
            <td>${txn.valuePdfDate}</td>
            <td>${txn.formattedWithdrawal}</td>
            <td>${txn.formattedDeposit}</td>
            <td>${txn.running_balance}</td>
        `;
    }
    return row;
}

/**
 * Formats date for display (e.g., "02 Mar 2023")
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Formats date for PDF (e.g., "02/03/23")
 * @param {string} dateStr - Date string
 * @returns {string} Formatted date
 */
function formatPDFDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
}

/**
 * Formats currency value with 2 decimal places
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Handles API error response
 * @param {Object} xhr - XMLHttpRequest object
 */
function handleErrorResponse(xhr) {
    toggleLoadingState(false);
    console.error("API Error:", xhr.responseText);
    alert("Failed to fetch report. Please try again.");
}

/**
 * Toggles loading state UI
 * @param {boolean} show - Whether to show loading state
 */
function toggleLoadingState(show) {
    // Implement your loading state UI here
    const loader = document.getElementById("loading-indicator");
    if (loader) {
        loader.style.display = show ? "block" : "none";
    }
}

    $(function () {
        // Initialize the datepicker on the input
        $("#frmDatePicker").datepicker({
            changeMonth: false,
            changeYear: false,
            showAnim: "slideDown",
            dateFormat: "dd-mm-yy"
        });

        // Trigger the datepicker when clicking the image
        $("#dateTrigger").click(function () {
            $("#frmDatePicker").datepicker("show");
        });
    });

    $(function () {
        $("#toDatePicker").datepicker({
            changeMonth: false,
            changeYear: false,
            showAnim: "slideDown",
            dateFormat: "dd-mm-yy"
        });

        // Trigger the datepicker when clicking the image
        $("#datetoTrigger").click(function () {
            $("#toDatePicker").datepicker("show");
        });
    });

