document.addEventListener('DOMContentLoaded', () => {
    const datePicker = document.getElementById('date-picker');
    const addNewBtn = document.getElementById('add-new'); 
    const submitBtn = document.getElementById('submit'); 
    const editBtn = document.getElementById('edit');
    const reportBtn = document.getElementById('report');
    const tableBody = document.querySelector('#data-entry-table tbody');
    const statusTime = document.getElementById('last-saved-time');
    const saveStatus = document.getElementById('save-status');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const searchBar = document.getElementById('search-bar');
    const filterDatePicker = document.getElementById('filter-date-picker');

    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const editForm = document.getElementById('edit-form');

    const footerAddNewBtn = document.getElementById('footer-add-new');
    const footerSaveBtn = document.getElementById('footer-save');
    const footerEditBtn = document.getElementById('footer-edit');
    const footerReportBtn = document.getElementById('footer-report');

    let dataChanged = false;

    // Filter by date
    filterDatePicker.addEventListener('change', () => {
        const selectedDate = filterDatePicker.value;
        if (selectedDate) {
            loadLastSaved(selectedDate);
        } else {
            loadLastSaved(); // Load latest if filter is cleared
        }
    });

    // Search functionality
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const customerName = row.querySelector('.customer-name');
            if (customerName) {
                const customerNameText = customerName.value.toLowerCase();
                const customerBlock = [];
                let currentRow = row;
                for (let i = 0; i < 5; i++) {
                    customerBlock.push(currentRow);
                    currentRow = currentRow.nextElementSibling;
                }

                if (customerNameText.includes(searchTerm)) {
                    customerBlock.forEach(r => r.style.display = '');
                } else {
                    customerBlock.forEach(r => r.style.display = 'none');
                }
            }
        });
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const saveState = () => {
        const state = {
            date: datePicker.value,
            table: tableBody.innerHTML,
        };
        localStorage.setItem('formState', JSON.stringify(state));
    };

    const restoreState = () => {
        const state = JSON.parse(localStorage.getItem('formState'));
        if (state) {
            datePicker.value = state.date;
            tableBody.innerHTML = state.table;
        }
    };

    // Set date picker to today's date
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;

    const markAsChanged = () => {
        dataChanged = true;
        saveStatus.textContent = 'Pending Changes';
        saveStatus.style.color = '#e74c3c';
    };

    const markAsSaved = () => {
        dataChanged = false;
        saveStatus.textContent = 'Saved Successfully';
        saveStatus.style.color = '#2ecc71';
        const now = new Date();
        statusTime.textContent = now.toLocaleString();
    };

    const createRow = (companyName, isFirstRow) => {
        const row = document.createElement('tr');
        row.classList.add('nb-row');
        let nameCell = '';
        let actionCell = '';

        if (isFirstRow) {
            nameCell = `<td rowspan="3" class="merged-cell"><input type="text" class="customer-name" placeholder="Customer Name"></td>`;
        }

        let iconClass = '';
        let iconAction = '';
        if (companyName === 'ML') {
            iconClass = 'fas fa-eye';
            iconAction = 'view-customer';
        } else if (companyName === 'NB') {
            iconClass = 'fas fa-print';
            iconAction = 'print-customer';
        } else if (companyName === 'Book') {
            iconClass = 'fas fa-broom';
            iconAction = 'clear-customer';
        }

        actionCell = `<td class="action-cell"><i class="${iconClass} ${iconAction}"></i></td>`;

        row.innerHTML = `
            ${nameCell}
            <td><input type="text" class="company" value="${companyName}" readonly></td>
            <td><input type="number" class="sold" placeholder="0"></td>
            <td><input type="number" class="rate" placeholder="0"></td>
            <td><input type="text" class="total" readonly></td>
            <td><input type="number" class="pwt" placeholder="0"></td>
            <td><input type="number" class="vc" placeholder="0"></td>
            <td><input type="text" class="current-bill" readonly></td>
            ${actionCell}
        `;
        return row;
    };

    const createTotalRow = () => {
        const row = document.createElement('tr');
        row.classList.add('total-row');
        row.innerHTML = `
            <td colspan="2" class="merged-cell">Total</td>
            <td><input type="text" class="total-sold" readonly></td>
            <td></td> <!-- Rate column, intentionally left blank -->
            <td><input type="text" class="total-total" readonly></td>
            <td><input type="text" class="total-pwt" readonly></td>
            <td><input type="text" class="total-vc" readonly></td>
            <td><input type="text" class="total-current-bill" readonly></td>
            <td class="action-cell"><i class="fas fa-trash-alt delete-customer"></i></td>
        `;
        return row;
    };

    // New row placed after the Total row for Running BILL, Balance and Outstanding
    const createRunningRow = () => {
        const row = document.createElement('tr');
        row.classList.add('running-row');
        // Place the three editable fields (Running BILL, Balance and Outstanding) directly after the title
        // Each field has a visible label immediately before the input as requested
        row.innerHTML = `
            <td colspan="2" class="merged-cell">Summary</td>
            <td><label class="running-label">Running BILL</label><br><input type="number" class="running-bill" placeholder="0" readonly></td>
            <td><label class="balance-label">Balance</label><br><input type="number" class="balance" placeholder="0"></td>
            <td><label class="outstanding-label">Outstanding</label><br><input type="number" class="running-outstanding" placeholder="0" readonly></td>
            <td></td> <!-- PWT -->
            <td></td> <!-- VC -->
            <td></td> <!-- Current Bill -->
            <td></td> <!-- Action -->
        `;
        return row;
    };

    // Helper to create a spacer row that spans the full table width
    function createSpacerRow() {
        const row = document.createElement('tr');
        row.classList.add('spacer-row');
        // Determine column count from the table header to set correct colspan
        const ths = document.querySelectorAll('#data-entry-table thead th');
        const colspan = ths ? ths.length : 9; // fallback to 9
        row.innerHTML = `<td colspan="${colspan}"></td>`;
        return row;
    }

    const addNewCustomer = () => {
        let customerName = prompt("Enter Customer Name or select from existing:");
        if (!customerName) return; // User cancelled

        customerName = customerName.trim();
        if (customerName === "") {
            alert("Customer name cannot be empty.");
            return;
        }

        // Update master customer list if new
        let customerList = JSON.parse(localStorage.getItem('e63se3ar8a_customer_list')) || [];
        if (!customerList.includes(customerName)) {
            customerList.push(customerName);
            localStorage.setItem('e63se3ar8a_customer_list', JSON.stringify(customerList));
        }

        const companies = ['ML', 'NB', 'Book'];
        // If table already has customers, insert a spacer row for visual separation
        if (tableBody.querySelectorAll('tr').length > 0) {
            const spacer = createSpacerRow();
            tableBody.appendChild(spacer);
        }
        const customerRows = [];

        const firstRow = createRow(companies[0], true);
        firstRow.querySelector('.customer-name').value = customerName;
        tableBody.appendChild(firstRow);
        customerRows.push(firstRow);

        for (let i = 1; i < companies.length; i++) {
            const nextRow = createRow(companies[i], false);
            tableBody.appendChild(nextRow);
            customerRows.push(nextRow);
        }

    const totalRow = createTotalRow();
    tableBody.appendChild(totalRow);
    customerRows.push(totalRow);

    // Append the new Running/Bal/Outstanding row after the total row
    const runningRow = createRunningRow();
    tableBody.appendChild(runningRow);
    customerRows.push(runningRow);

    // Calculate initial totals for the new customer (customerRows now contains 5 rows)
    calculateCustomerTotals(customerRows);
    markAsChanged();
    };

    // Helper to create a spacer row that spans the full table width
    // (defined earlier to ensure it's available when addNewCustomer runs)

    const calculateRow = (row) => {
        const sold = parseFloat(row.querySelector('.sold').value) || 0;
        const rate = parseFloat(row.querySelector('.rate').value) || 0;
        const pwt = parseFloat(row.querySelector('.pwt').value) || 0;
        const vc = parseFloat(row.querySelector('.vc').value) || 0;

        const total = sold * rate;
        const currentBill = total - (pwt + vc);

        row.querySelector('.total').value = total.toFixed(2);
        row.querySelector('.current-bill').value = currentBill.toFixed(2);
        markAsChanged();

        // After calculating a company row, recalculate customer totals
        // Find the customer block (5 rows: 3 company + 1 total row + 1 running row)
    // This logic needs to be robust, finding the start (customer-name row) and then collecting the next 4 rows (3 company + total + running).
        let customerBlockStart = row;
        while(customerBlockStart && !customerBlockStart.querySelector('.customer-name')) {
            customerBlockStart = customerBlockStart.previousElementSibling;
        }
        if (customerBlockStart) {
            const customerRows = [];
            let currentRow = customerBlockStart;
            for (let i = 0; i < 5; i++) { // Collect 5 rows: 3 company + 1 total + 1 running
                if (currentRow) {
                    customerRows.push(currentRow);
                    currentRow = currentRow.nextElementSibling;
                } else {
                    break;
                }
            }
            if (customerRows.length === 5) { // Ensure we have a complete block
                calculateCustomerTotals(customerRows);
            }
        }
    };

    const calculateCustomerTotals = (customerRows) => {
        let totalSold = 0;
        let totalTotal = 0;
        let totalPwt = 0;
        let totalVc = 0;
        let totalCurrentBill = 0;

        // Iterate through the company rows (first 3 rows in customerRows)
        for (let i = 0; i < 3; i++) {
            const row = customerRows[i];
            totalSold += parseFloat(row.querySelector('.sold').value) || 0;
            totalTotal += parseFloat(row.querySelector('.total').value) || 0;
            totalPwt += parseFloat(row.querySelector('.pwt').value) || 0;
            totalVc += parseFloat(row.querySelector('.vc').value) || 0;
            totalCurrentBill += parseFloat(row.querySelector('.current-bill').value) || 0;
        }

        // Update the total row (the last row in customerRows, which is the 4th row, index 3)
        const totalRow = customerRows[3];
        totalRow.querySelector('.total-sold').value = totalSold.toFixed(2);
        totalRow.querySelector('.total-total').value = totalTotal.toFixed(2);
        totalRow.querySelector('.total-pwt').value = totalPwt.toFixed(2);
        totalRow.querySelector('.total-vc').value = totalVc.toFixed(2);
        totalRow.querySelector('.total-current-bill').value = totalCurrentBill.toFixed(2);

        // Running bill (summary) should reflect the total current bill and must be non-editable.
        // Outstanding = Running Bill + Balance (balance is editable)
        const runningRow = customerRows[4];
        if (runningRow) {
            const runningEl = runningRow.querySelector('.running-bill');
            const balanceEl = runningRow.querySelector('.balance');
            const outstandingEl = runningRow.querySelector('.running-outstanding');

            // Set Running Bill to the sum of current bills for this customer
            runningEl.value = totalCurrentBill.toFixed(2);

            // Compute outstanding as running + balance (balance may be empty)
            const balanceVal = parseFloat(balanceEl.value) || 0;
            const runningVal = parseFloat(runningEl.value) || 0;
            const outstandingVal = runningVal + balanceVal;
            outstandingEl.value = outstandingVal.toFixed(2);
        }

        // Running row is intentionally left editable and separate from table calculations.
        // Do not auto-populate running/balance/outstanding here — logic will be added later as requested.
    };

    const saveData = () => {
        // Ignore spacer rows when constructing logical rows to save
        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        const rows = allRows.filter(r => !r.classList.contains('spacer-row'));

        if (rows.length === 0) {
            alert('No data to save.');
            return;
        }

        // The number of logical rows must be a multiple of 5 (3 company rows + 1 total row + 1 running row)
        if (rows.length % 5 !== 0) {
            alert('Table data is corrupted. Please ensure each customer has 3 company rows, 1 total row and 1 running row.');
            return;
        }

        let lastCustomerName = '';
        const date = datePicker.value;

        // Retrieve existing index or initialize a new one
        let index = JSON.parse(localStorage.getItem('e63se3ar8a_index')) || [];

        for (let i = 0; i < rows.length; i += 5) { // Iterate in steps of 5 (3 company rows + 1 total row + 1 running row)
            const firstRowOfCustomer = rows[i];
            const customerNameInput = firstRowOfCustomer.querySelector('.merged-cell .customer-name');

            if (!customerNameInput) {
                console.error(`Data structure error at logical row ${i+1}. Could not find customer name input.`);
                alert(`Data structure error at row ${i+1}. Could not find customer name.`);
                continue; // Skip to the next customer block
            }

            const customerName = customerNameInput.value.trim();
            if (!customerName) {
                alert('Customer name is required for all customers.');
                return; // Stop the entire save process if a name is missing
            }

            const record = {
                name: customerName,
                date: date,
                companies: []
            };

            // Collect data from the 3 company rows (skip the 4th total row and 5th running row when saving)
            for (let j = 0; j < 3; j++) {
                const currentRow = rows[i + j];
                record.companies.push({
                    name: currentRow.querySelector('.company').value,
                    sold: currentRow.querySelector('.sold').value,
                    rate: currentRow.querySelector('.rate').value,
                    total: currentRow.querySelector('.total').value,
                    pwt: currentRow.querySelector('.pwt').value,
                    vc: currentRow.querySelector('.vc').value,
                    currentBill: currentRow.querySelector('.current-bill').value
                });
            }

            // Collect running/summary row values (5th row)
            const runningRowEl = rows[i + 4];
            if (runningRowEl) {
                record.summary = {
                    runningBill: runningRowEl.querySelector('.running-bill') ? runningRowEl.querySelector('.running-bill').value : '',
                    balance: runningRowEl.querySelector('.balance') ? runningRowEl.querySelector('.balance').value : '',
                    outstanding: runningRowEl.querySelector('.running-outstanding') ? runningRowEl.querySelector('.running-outstanding').value : ''
                };
            } else {
                record.summary = { runningBill: '', balance: '', outstanding: '' };
            }

            const recordKey = `e63se3ar8a_${customerName}_${date}`;
            localStorage.setItem(recordKey, JSON.stringify(record));
            console.log(`Saved record for ${customerName} on ${date}:`, record);

            // Update master customer list
            let customerList = JSON.parse(localStorage.getItem('e63se3ar8a_customer_list')) || [];
            if (!customerList.includes(customerName)) {
                customerList.push(customerName);
                localStorage.setItem('e63se3ar8a_customer_list', JSON.stringify(customerList));
            }

            // Update index: remove old entry if exists, then add new one
            index = index.filter(item => !(item.name === customerName && item.date === date));
            index.push({ name: customerName, date: date });
            
            lastCustomerName = customerName;
        }
        localStorage.setItem('e63se3ar8a_index', JSON.stringify(index));
        console.log('Updated index after save:', index);

        if(lastCustomerName){
            localStorage.setItem('last_saved_record', JSON.stringify({name: lastCustomerName, date: date}));
        }

        markAsSaved();
        alert('All customer data has been saved successfully!');
    };

    const loadRecord = (customerName, date) => {
        const recordKey = `e63se3ar8a_${customerName}_${date}`;
        const data = JSON.parse(localStorage.getItem(recordKey));
        console.log(`Attempting to load record for ${customerName} on ${date}:`, data);

        if (data) {
            // Clear the table only if we are loading a specific record
            tableBody.innerHTML = '';
            datePicker.value = data.date;

            const customerRows = []; // To hold the 3 company rows and 1 total row

            data.companies.forEach((companyData, index) => {
                const isFirstRow = index === 0;
                const newRow = createRow(companyData.name, isFirstRow);
                
                if(isFirstRow){
                    newRow.querySelector('.customer-name').value = data.name;
                }

                newRow.querySelector('.sold').value = companyData.sold;
                newRow.querySelector('.rate').value = companyData.rate;
                newRow.querySelector('.total').value = companyData.total;
                newRow.querySelector('.pwt').value = companyData.pwt;
                newRow.querySelector('.vc').value = companyData.vc;
                newRow.querySelector('.current-bill').value = companyData.currentBill;
                    // s-vc, previous-bill and total-outstanding columns removed
                tableBody.appendChild(newRow);
                customerRows.push(newRow);
            });

            // Append and calculate the total row and the new running row for this customer
            const totalRow = createTotalRow();
            tableBody.appendChild(totalRow);
            customerRows.push(totalRow);

            const runningRow = createRunningRow();
            tableBody.appendChild(runningRow);
            customerRows.push(runningRow);

            // If loaded data contains summary values, populate running row inputs
            if (data.summary) {
                const runningEl = customerRows[4];
                if (runningEl) {
                    if (runningEl.querySelector('.running-bill')) runningEl.querySelector('.running-bill').value = data.summary.runningBill || '';
                    if (runningEl.querySelector('.balance')) runningEl.querySelector('.balance').value = data.summary.balance || '';
                    if (runningEl.querySelector('.running-outstanding')) runningEl.querySelector('.running-outstanding').value = data.summary.outstanding || '';
                }
            }

            calculateCustomerTotals(customerRows);

            saveStatus.textContent = 'Loaded from memory';
        } else {
            alert('No record found for this customer and date.');
        }
    };
    
    // Updated loadLastSaved to handle 5 rows per customer block (3 company + 1 total + 1 running)
    const loadLastSaved = (filterDate = null) => {
        console.log('loadLastSaved function called.');
        const index = JSON.parse(localStorage.getItem('e63se3ar8a_index')) || [];
        console.log('Index from localStorage:', index);

        if (index.length === 0) {
            console.log('No saved data in index.');
            return; // No saved data to load
        }

        // Find the latest date in the index
        const latestDate = filterDate || index.reduce((maxDate, record) => {
            return (new Date(record.date) > new Date(maxDate)) ? record.date : maxDate;
        }, '1970-01-01'); // Initialize with a very old date
        console.log('Latest date found:', latestDate);

        // Filter records for the latest date
        const recordsForLatestDate = index.filter(record => record.date === latestDate);
        console.log('Records for latest date:', recordsForLatestDate);

        // Clear existing table content before loading new data
        tableBody.innerHTML = '';

        // Sort records by customer name for consistent loading order
        recordsForLatestDate.sort((a, b) => a.name.localeCompare(b.name));

        // Load each customer's data for the latest date
        recordsForLatestDate.forEach(record => {
            // Insert spacer between customers for readability
            if (tableBody.querySelectorAll('tr').length > 0) {
                tableBody.appendChild(createSpacerRow());
            }
            const recordKey = `e63se3ar8a_` + record.name + `_` + record.date;
            const data = JSON.parse(localStorage.getItem(recordKey));
            console.log(`Loading data for ${record.name} on ${record.date}:`, data);

            if (data) {
                const customerRows = [];
                data.companies.forEach((companyData, idx) => {
                    const isFirstRow = idx === 0;
                    const newRow = createRow(companyData.name, isFirstRow);
                    
                    if(isFirstRow){
                        newRow.querySelector('.customer-name').value = data.name;
                    }

                    newRow.querySelector('.sold').value = companyData.sold;
                    newRow.querySelector('.rate').value = companyData.rate;
                    newRow.querySelector('.total').value = companyData.total;
                    newRow.querySelector('.pwt').value = companyData.pwt;
                    newRow.querySelector('.vc').value = companyData.vc;
                    newRow.querySelector('.current-bill').value = companyData.currentBill;
                    tableBody.appendChild(newRow);
                    customerRows.push(newRow);
                });
                const totalRow = createTotalRow();
                tableBody.appendChild(totalRow);
                customerRows.push(totalRow);

                const runningRow = createRunningRow();
                tableBody.appendChild(runningRow);
                customerRows.push(runningRow);

                if (data.summary) {
                    const runningEl = customerRows[4];
                    if (runningEl) {
                        if (runningEl.querySelector('.running-bill')) runningEl.querySelector('.running-bill').value = data.summary.runningBill || '';
                        if (runningEl.querySelector('.balance')) runningEl.querySelector('.balance').value = data.summary.balance || '';
                        if (runningEl.querySelector('.running-outstanding')) runningEl.querySelector('.running-outstanding').value = data.summary.outstanding || '';
                    }
                }

                calculateCustomerTotals(customerRows);
            } else {
                console.warn(`No data found in localStorage for key: ${recordKey}`);
            }
        });
        datePicker.value = latestDate; // Set the date picker to the latest loaded date
        saveStatus.textContent = `Loaded data for ${latestDate}`;
        console.log('Table populated with', tableBody.querySelectorAll('tr').length, 'rows.');
    };

    // Event Listeners
    // addNewBtn.addEventListener('click', addNewCustomer); // Removed as button is removed from HTML
    footerAddNewBtn.addEventListener('click', addNewCustomer);

    // submitBtn.addEventListener('click', saveData); // Removed as button is removed from HTML
    footerSaveBtn.addEventListener('click', saveData);

    tableBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('sold') || e.target.classList.contains('rate') || e.target.classList.contains('pwt') || e.target.classList.contains('vc')) {
            const row = e.target.closest('tr');
            calculateRow(row);
        }

        // If balance changes, update the Outstanding for this customer: Outstanding = Running Bill + Balance
        if (e.target.classList.contains('balance')) {
            const balanceInput = e.target;
            // Find the start of this customer block
            let customerBlockStart = balanceInput.closest('tr');
            while (customerBlockStart && !customerBlockStart.querySelector('.customer-name')) {
                customerBlockStart = customerBlockStart.previousElementSibling;
            }
            if (customerBlockStart) {
                // Find the running-row for this customer by scanning forward
                let current = customerBlockStart;
                let runningRowEl = null;
                while (current) {
                    if (current.classList && current.classList.contains('running-row')) {
                        runningRowEl = current;
                        break;
                    }
                    current = current.nextElementSibling;
                }
                if (runningRowEl) {
                    const runningBillVal = parseFloat(runningRowEl.querySelector('.running-bill').value) || 0;
                    const balanceVal = parseFloat(balanceInput.value) || 0;
                    const outstandingEl = runningRowEl.querySelector('.running-outstanding');
                    outstandingEl.value = (runningBillVal + balanceVal).toFixed(2);
                }
            }
            markAsChanged();
        }

        if(e.target.classList.contains('customer-name')) {
            markAsChanged();
        }
    });

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-customer')) {
            if(confirm('Are you sure you want to delete this entire customer?')){
                const rowToDelete = e.target.closest('tr');
                // Find the first row of the customer block (which contains the customer name and has rowspan 3)
                let customerBlockStart = rowToDelete;
                while(customerBlockStart && !customerBlockStart.querySelector('.customer-name')) {
                    customerBlockStart = customerBlockStart.previousElementSibling;
                }

                if (customerBlockStart) {
                    // Collect all 5 rows belonging to this customer block (3 company + total + running)
                    const rowsToRemove = [];
                    let currentRow = customerBlockStart;
                    for (let i = 0; i < 5; i++) {
                        if (currentRow) {
                            rowsToRemove.push(currentRow);
                            currentRow = currentRow.nextElementSibling;
                        } else {
                            break;
                        }
                    }
                    rowsToRemove.forEach(row => row.remove());

                    // Remove any spacer row that immediately precedes or follows this customer block
                    const spacerBefore = customerBlockStart.previousElementSibling;
                    if (spacerBefore && spacerBefore.classList && spacerBefore.classList.contains('spacer-row')) {
                        spacerBefore.remove();
                    }
                    const lastRemoved = rowsToRemove[rowsToRemove.length - 1];
                    const spacerAfter = lastRemoved ? lastRemoved.nextElementSibling : null;
                    if (spacerAfter && spacerAfter.classList && spacerAfter.classList.contains('spacer-row')) {
                        spacerAfter.remove();
                    }

                    // Also remove the customer from the index and master list
                    const customerName = customerBlockStart.querySelector('.customer-name').value;
                    const date = datePicker.value;
                    const recordKey = `e63se3ar8a_${customerName}_${date}`;
                    localStorage.removeItem(recordKey);

                    let index = JSON.parse(localStorage.getItem('e63se3ar8a_index')) || [];
                    index = index.filter(item => !(item.name === customerName && item.date === date));
                    localStorage.setItem('e63se3ar8a_index', JSON.stringify(index));

                    let customerList = JSON.parse(localStorage.getItem('e63se3ar8a_customer_list')) || [];
                    customerList = customerList.filter(name => name !== customerName);
                    localStorage.setItem('e63se3ar8a_customer_list', JSON.stringify(customerList));
                }
                markAsChanged();
            }
        }

        if (e.target.classList.contains('view-customer')) {
            const row = e.target.closest('tr');
            showCustomerDetails(row);
        }
    });

    const showCustomerDetails = (row) => {
        const customerName = row.querySelector('.customer-name').value || 'N/A';
        
        // Find the start of the customer block and collect all 5 rows
        let customerBlockStart = row;
        while(customerBlockStart && !customerBlockStart.querySelector('.customer-name')) {
            customerBlockStart = customerBlockStart.previousElementSibling;
        }

        const customerRows = [];
        let currentRow = customerBlockStart;
        for (let i = 0; i < 5; i++) { // Collect 5 rows: 3 company + 1 total + 1 running
            if (currentRow) {
                customerRows.push(currentRow);
                currentRow = currentRow.nextElementSibling;
            } else {
                break;
            }
        }
        
        // If not a complete block, or if the customer name is not found, handle gracefully
        if (customerRows.length !== 5 || !customerBlockStart.querySelector('.customer-name')) {
            console.error('Invalid customer block detected for showCustomerDetails.');
            return;
        }

    let detailsHtml = `<h2>Customer Details</h2><p><strong>Name:</strong> ${customerName}</p>`;
    // Add an extra empty header cell at start (for Name column) and an empty header at end (for Action column)
    detailsHtml += '<table><thead><tr><th></th><th>Company</th><th>Sold</th><th>Rate</th><th>Total</th><th>PWT</th><th>VC</th><th>Current Bill</th><th></th></tr></thead><tbody>';

        // Display company rows
        for (let i = 0; i < 3; i++) {
            const r = customerRows[i];
            const company = r.querySelector('.company').value;
            const sold = r.querySelector('.sold').value || 0;
            const rate = r.querySelector('.rate').value || 0;
            const total = r.querySelector('.total').value || 0;
            const pwt = parseFloat(r.querySelector('.pwt').value) || 0; // Ensure float for consistency
            const vc = parseFloat(r.querySelector('.vc').value) || 0;     // Ensure float for consistency
            const currentBill = parseFloat(r.querySelector('.current-bill').value) || 0; // Ensure float for consistency

            // Prepend an empty cell so company columns align with the main table (which has a Name column at the start)
            detailsHtml += `<tr>
                <td></td>
                <td>${company}</td>
                <td>${sold}</td>
                <td>${rate}</td>
                <td>${total}</td>
                <td>${pwt.toFixed(2)}</td>
                <td>${vc.toFixed(2)}</td>
                <td>${currentBill.toFixed(2)}</td>
                <td></td>
            </tr>`;
        }
        
        // Display total row
        const totalRow = customerRows[3];
        // Ensure the values from the total row in the main table are used
        const totalSoldVal = totalRow.querySelector('.total-sold').value;
        const totalTotalVal = totalRow.querySelector('.total-total').value;
        const totalPwtVal = totalRow.querySelector('.total-pwt').value;
        const totalVcVal = totalRow.querySelector('.total-vc').value;
        const totalCurrentBillVal = totalRow.querySelector('.total-current-bill').value;

        detailsHtml += `<tr class="total-row-popup">
            <td colspan="2"><strong>Total</strong></td>
            <td><strong>${totalSoldVal}</strong></td>
            <td></td>
            <td><strong>${totalTotalVal}</strong></td>
            <td><strong>${totalPwtVal}</strong></td>
            <td><strong>${totalVcVal}</strong></td>
            <td><strong>${totalCurrentBillVal}</strong></td>
        </tr>`;

        // Display running row values (running, balance, outstanding)
        const runningRow = customerRows[4];
        const runningVal = runningRow.querySelector('.running-bill').value || '0.00';
        const balanceVal = runningRow.querySelector('.balance').value || '0.00';
        const runningOutVal = runningRow.querySelector('.running-outstanding').value || '0.00';

        // Render the summary row to match the data-entry table layout: colspan=2 (Name+Company) then Running, Balance, Outstanding under Sold, Rate, Total
        detailsHtml += `<tr class="running-row-popup">
            <td colspan="2"><strong>Summary</strong></td>
            <td><strong>Running BILL</strong><br>${runningVal}</td>
            <td><strong>Balance</strong><br>${balanceVal}</td>
            <td><strong>Outstanding</strong><br>${runningOutVal}</td>
            <td></td>
            <td></td>
            <td></td>
        </tr>`;

        detailsHtml += '</tbody></table>';
        createCustomerPopup(detailsHtml);
    };

    const createCustomerPopup = (content) => {
        const popup = document.createElement('div');
        popup.classList.add('modal', 'customer-details-popup');
        popup.style.display = 'block';

        const popupContent = document.createElement('div');
        popupContent.classList.add('modal-content');
        
        const closeButton = document.createElement('span');
        closeButton.classList.add('close-button');
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => popup.remove();

        popupContent.appendChild(closeButton);
        popupContent.innerHTML += content;

        popup.appendChild(popupContent);
        document.body.appendChild(popup);

        window.onclick = (e) => {
            if (e.target == popup) {
                popup.remove();
            }
        };
    };

    reportBtn.addEventListener('click', () => { window.location.href = 'report.html'; });
    footerReportBtn.addEventListener('click', () => { window.location.href = 'report.html'; });

    // Modal logic
    editBtn.addEventListener('click', () => { editModal.style.display = 'block'; });
    footerEditBtn.addEventListener('click', () => { editModal.style.display = 'block'; });
    closeModalBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
    window.addEventListener('click', (e) => {
        if (e.target == editModal) {
            editModal.style.display = 'none';
        }
    });

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customerName = document.getElementById('edit-customer-name').value;
        const date = document.getElementById('edit-date').value;
        loadRecord(customerName, date);
        editModal.style.display = 'none';
    });

    // --- Security Layer ---
    const securityOverlay = document.getElementById('security-overlay');
    const pinOverrideInput = document.getElementById('pin-override');
    const pinSubmitBtn = document.getElementById('pin-submit');

    const generateFingerprint = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const txt = 'i9asdm_a-32j(ad..A';
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText(txt, 4, 17);
        return canvas.toDataURL();
    };

    const checkDeviceLock = () => {
        const deviceId = localStorage.getItem('device_lock_id');
        const fingerprint = localStorage.getItem('device_fingerprint');
        
        if (!deviceId || !fingerprint) {
            // First time load, register this device
            const newId = Math.random().toString(36).substr(2, 9);
            const newFingerprint = generateFingerprint();
            localStorage.setItem('device_lock_id', newId);
            localStorage.setItem('device_fingerprint', newFingerprint);
            console.log('Device registered.');
            restoreState(); // Restore state after registration
            loadLastSaved();
        } else {
            const currentFingerprint = generateFingerprint();
            if (fingerprint !== currentFingerprint) {
                securityOverlay.style.display = 'flex';
            } else {
                restoreState(); // Restore state on successful check
                loadLastSaved();
            }
        }
    };

    pinSubmitBtn.addEventListener('click', () => {
        const pin = pinOverrideInput.value;
        // In a real app, this would be a hashed comparison
        // For this version, we'll use a simple hardcoded PIN or a stored one.
        let storedPinHash = localStorage.getItem('user_pin_hash');
        if (!storedPinHash) {
            // If no PIN is set, let's set a default one for demo purposes '1234'
            // In a real scenario, admin would set this up.
            storedPinHash = '1234'; // In a real app, this should be a hash
        }

        if (pin === storedPinHash) {
            // Override successful, register new device
            const newId = Math.random().toString(36).substr(2, 9);
            const newFingerprint = generateFingerprint();
            localStorage.setItem('device_lock_id', newId);
            localStorage.setItem('device_fingerprint', newFingerprint);
            securityOverlay.style.display = 'none';
            alert('Device registration overridden successfully!');
            loadLastSaved();
        } else {
            alert('Incorrect PIN.');
        }
    });

    // Initial load with security check
    checkDeviceLock();

    // Check if a record needs to be loaded for editing from report page
    const editRecordKey = sessionStorage.getItem('edit_record_key');
    if (editRecordKey) {
        const parts = editRecordKey.split('_'); // e63se3ar8a_customerName_date
        if (parts.length === 3) {
            const customerName = parts[1];
            const date = parts[2];
            loadRecord(customerName, date);
        }
        sessionStorage.removeItem('edit_record_key'); // Clear the key after loading
    }
});