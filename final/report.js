document.addEventListener('DOMContentLoaded', () => {
    const recordList = document.getElementById('record-list');
    const searchBar = document.getElementById('search-bar');
    const reportContent = document.getElementById('report-content');
    const downloadPdfBtn = document.getElementById('download-pdf');
    const deleteRecordBtn = document.getElementById('delete-record');
    const editAgainBtn = document.getElementById('edit-again');
    const downloadAllBtn = document.getElementById('download-all');
    const clearAllBtn = document.getElementById('clear-all');
    const datePicker = document.getElementById('date-picker');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const selectAllBtn = document.getElementById('select-all-records');
    const clearAllBtn = document.getElementById('clear-all-records');

    selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.record-checkbox, .date-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    clearAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.record-checkbox, .date-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    let currentSelected = null;
    const { jsPDF } = window.jspdf;

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

    const displayRecord = (name, date) => {
        const recordKey = `e63se3ar8a_${name}_${date}`;
        const record = JSON.parse(localStorage.getItem(recordKey));

        if (record) {
            currentSelected = { name, date };
            let htmlContent = `<h2>${record.name} - ${record.date}</h2>`;
            htmlContent += `<table>
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Sold</th>
                                        <th>Rate</th>
                                        <th>Total</th>
                                        <th>PWT</th>
                                        <th>VC</th>
                                        <th>Current Bill</th>
                                    </tr>
                                </thead>
                                <tbody>`;

            let totalSold = 0;
            let totalTotal = 0;
            let totalPwt = 0;
            let totalVc = 0;
            let totalCurrentBill = 0;

            record.companies.forEach(companyData => {
                htmlContent += `<tr>
                                    <td>${companyData.name}</td>
                                    <td>${companyData.sold}</td>
                                    <td>${companyData.rate}</td>
                                    <td>${companyData.total}</td>
                                    <td>${companyData.pwt}</td>
                                    <td>${companyData.vc}</td>
                                    <td>${companyData.currentBill}</td>
                                </tr>`;
                
                totalSold += parseFloat(companyData.sold) || 0;
                totalTotal += parseFloat(companyData.total) || 0;
                totalPwt += parseFloat(companyData.pwt) || 0;
                totalVc += parseFloat(companyData.vc) || 0;
                totalCurrentBill += parseFloat(companyData.currentBill) || 0;
            });

            htmlContent += `<tr style="font-weight: bold;">
                                <td>Total</td>
                                <td>${totalSold.toFixed(2)}</td>
                                <td></td>
                                <td>${totalTotal.toFixed(2)}</td>
                                <td>${totalPwt.toFixed(2)}</td>
                                <td>${totalVc.toFixed(2)}</td>
                                <td>${totalCurrentBill.toFixed(2)}</td>
                            </tr>`;

            if (record.summary) {
                htmlContent += `<tr style="font-weight: bold;">
                                    <td>Summary</td>
                                    <td colspan="6">Running BILL: ${record.summary.runningBill || ""} | Balance: ${record.summary.balance || ""} | Outstanding: ${record.summary.outstanding || ""}</td>
                                </tr>`;
            }

            htmlContent += `</tbody></table>`;
            reportContent.innerHTML = htmlContent;
        } else {
            reportContent.innerHTML = `<p>No record found for ${name} on ${date}.</p>`;
            currentSelected = null;
        }
    };

    const generatePdf = () => {
        if (!currentSelected) {
            alert('Please select a record to generate PDF.');
            return;
        }

        const doc = new jsPDF();
        const recordKey = `e63se3ar8a_${currentSelected.name}_${currentSelected.date}`;
        const record = JSON.parse(localStorage.getItem(recordKey));

        doc.text(`Customer Report: ${record.name} - ${record.date}`, 10, 10);

        const tableColumn = ["Company", "Sold", "Rate", "Total", "PWT", "VC", "Current Bill"];
        const tableRows = [];

        let totalSold = 0;
        let totalTotal = 0;
        let totalPwt = 0;
        let totalVc = 0;
        let totalCurrentBill = 0;

        record.companies.forEach(companyData => {
            const rowData = [
                companyData.name,
                companyData.sold,
                companyData.rate,
                companyData.total,
                companyData.pwt,
                companyData.vc,
                companyData.currentBill
            ];
            tableRows.push(rowData);

            totalSold += parseFloat(companyData.sold) || 0;
            totalTotal += parseFloat(companyData.total) || 0;
            totalPwt += parseFloat(companyData.pwt) || 0;
            totalVc += parseFloat(companyData.vc) || 0;
            totalCurrentBill += parseFloat(companyData.currentBill) || 0;
        });

        const totalRow = [
            "Total",
            totalSold.toFixed(2),
            "",
            totalTotal.toFixed(2),
            totalPwt.toFixed(2),
            totalVc.toFixed(2),
            totalCurrentBill.toFixed(2)
        ];
        tableRows.push(totalRow);

        // If record has summary (running/balance/outstanding), add it as a separate row after the totals
        if (record.summary) {
            const runningRow = [
                "Summary",
                `Running BILL: ${record.summary.runningBill || ""}`,
                `Balance: ${record.summary.balance || ""}`,
                `Outstanding: ${record.summary.outstanding || ""}`,
                "",
                "",
                "",
                "",
                "",
                ""
            ];
            tableRows.push(runningRow);
        }

        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save(`${record.name}-${record.date}-report.pdf`);
    };

    const deleteRecord = () => {
        const recordsToDelete = getSelectedRecords();
        console.log('Records to delete:', recordsToDelete);

        if (recordsToDelete.length === 0) {
            alert('Please select at least one record to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${recordsToDelete.length} selected record(s)?`)) {
            recordsToDelete.forEach(selectedRecord => {
                const recordKey = `e63se3ar8a_${selectedRecord.name}_${selectedRecord.date}`;
                localStorage.removeItem(recordKey);
                console.log(`Deleted record with key: ${recordKey}`);

                let index = JSON.parse(localStorage.getItem('e63se3ar8a_index')) || [];
                index = index.filter(item => !(item.name === selectedRecord.name && item.date === selectedRecord.date));
                localStorage.setItem('e63se3ar8a_index', JSON.stringify(index));
                console.log('Updated index:', index);

                // Clear last saved record if it was one of the deleted ones
                const lastSaved = JSON.parse(localStorage.getItem('last_saved_record'));
                if (lastSaved && lastSaved.name === selectedRecord.name && lastSaved.date === selectedRecord.date) {
                    localStorage.removeItem('last_saved_record');
                    console.log('Removed last_saved_record.');
                }
            });

            reportContent.innerHTML = '<p>Select a record from the list to view details.</p>';
            currentSelected = null;
            loadRecords(); // Reload the list of records
            alert(`${recordsToDelete.length} record(s) deleted successfully.`);
        }
    };

    const editAgain = () => {
        const selectedRecords = getSelectedRecords();
        console.log('Records to edit:', selectedRecords);

        if (selectedRecords.length === 0) {
            alert('Please select a single record to edit.');
            return;
        }

        if (selectedRecords.length > 1) {
            alert('Please select only one record to edit.');
            return;
        }

        const recordToEdit = selectedRecords[0];
        const editRecordKey = `e63se3ar8a_${recordToEdit.name}_${recordToEdit.date}`;
        sessionStorage.setItem('edit_record_key', editRecordKey);
        console.log('Setting edit_record_key:', editRecordKey);
        window.location.href = 'index.html';
    };

    const loadRecords = (filterDate = null) => {
        console.log('loadRecords: Starting...');
        const index = JSON.parse(localStorage.getItem('e63se3ar8a_index')) || [];
        console.log('loadRecords - Retrieved Index:', index);
        recordList.innerHTML = '';

        if (index.length === 0) {
            console.log('loadRecords: Index is empty. No records to display.');
            recordList.innerHTML = '<p>No saved records found.</p>';
            return;
        }

        const filteredIndex = filterDate 
            ? index.filter(record => record.date === filterDate) 
            : index;
        console.log('loadRecords - Filtered Index:', filteredIndex);

        if (filteredIndex.length === 0) {
            console.log('loadRecords: Filtered index is empty. No records for this date.');
            recordList.innerHTML = '<p>No records found for the selected date.</p>';
            return;
        }

        const groupedByDate = filteredIndex.reduce((acc, record) => {
            (acc[record.date] = acc[record.date] || []).push(record);
            return acc;
        }, {});
        console.log('loadRecords - Grouped by Date:', groupedByDate);

        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
        console.log('loadRecords - Sorted Dates:', sortedDates);

        for (const date of sortedDates) {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.innerHTML = `<input type="checkbox" class="date-checkbox" data-date="${date}"> <span>${date}</span>`;
            dateGroup.appendChild(dateHeader);

            const customerList = document.createElement('div');
            customerList.className = 'customer-list';
            groupedByDate[date].forEach(record => {
                const customerEntry = document.createElement('div');
                customerEntry.className = 'customer-entry';
                customerEntry.innerHTML = `<input type="checkbox" class="record-checkbox" data-name="${record.name}" data-date="${record.date}"> <span class="record-name">${record.name}</span>`;
                customerEntry.dataset.name = record.name;
                customerEntry.dataset.date = record.date;
                customerList.appendChild(customerEntry);
                console.log(`loadRecords: Added customer entry for ${record.name} on ${record.date}`);
            });

            dateGroup.appendChild(customerList);
            recordList.appendChild(dateGroup);
            console.log(`loadRecords: Added date group for ${date}`);
        }
        console.log('loadRecords: Finished populating recordList.');
    };

    const getSelectedRecords = () => {
        const selectedCheckboxes = document.querySelectorAll('.record-checkbox:checked');
        const recordsToDownload = [];
        selectedCheckboxes.forEach(checkbox => {
            recordsToDownload.push({
                name: checkbox.dataset.name,
                date: checkbox.dataset.date
            });
        });
        console.log('getSelectedRecords - recordsToDownload:', recordsToDownload);
        return recordsToDownload;
    };

    const downloadAll = () => {
        const recordsToProcess = getSelectedRecords();
        console.log('downloadAll - recordsToProcess:', recordsToProcess);

        if (recordsToProcess.length === 0) {
            alert('Please select at least one record to download.');
            return;
        }

        const combineCustomers = document.getElementById('combine-customers-toggle').checked;
        const doc = new jsPDF();

        const groupedByDate = recordsToProcess.reduce((acc, record) => {
            (acc[record.date] = acc[record.date] || []).push(record);
            return acc;
        }, {});

        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

        sortedDates.forEach((date, dateIndex) => {
            const recordsForDate = groupedByDate[date];
            let startY = 30;

            if (dateIndex > 0) {
                doc.addPage();
            }
            doc.text(`Report for Date: ${date}`, 10, 15);

            recordsForDate.forEach((selectedRecord, recordIndex) => {
                const record = JSON.parse(localStorage.getItem(`e63se3ar8a_${selectedRecord.name}_${selectedRecord.date}`));
                if (record) {
                    const tableColumn = ["Company", "Sold", "Rate", "Total", "PWT", "VC", "Current Bill"];
                    const tableRows = [];

                    let totalSold = 0;
                    let totalTotal = 0;
                    let totalPwt = 0;
                    let totalVc = 0;
                    let totalCurrentBill = 0;

                    record.companies.forEach(companyData => {
                        const rowData = [
                            companyData.name,
                            companyData.sold,
                            companyData.rate,
                            companyData.total,
                            companyData.pwt,
                            companyData.vc,
                            companyData.currentBill
                        ];
                        tableRows.push(rowData);

                        totalSold += parseFloat(companyData.sold) || 0;
                        totalTotal += parseFloat(companyData.total) || 0;
                        totalPwt += parseFloat(companyData.pwt) || 0;
                        totalVc += parseFloat(companyData.vc) || 0;
                        totalCurrentBill += parseFloat(companyData.currentBill) || 0;
                    });

                    const totalRow = [
                        "Total",
                        totalSold.toFixed(2),
                        "",
                        totalTotal.toFixed(2),
                        totalPwt.toFixed(2),
                        totalVc.toFixed(2),
                        totalCurrentBill.toFixed(2)
                    ];
                    tableRows.push(totalRow);

                    if (record.summary) {
                        const runningRow = [
                            "Summary",
                            `Running BILL: ${record.summary.runningBill || ""}`,
                            `Balance: ${record.summary.balance || ""}`,
                            `Outstanding: ${record.summary.outstanding || ""}`,
                            "", "", "", "", "", ""
                        ];
                        tableRows.push(runningRow);
                    }

                    if (recordIndex > 0) {
                        if (combineCustomers) {
                            const pageHeight = doc.internal.pageSize.height;
                            const marginBottom = 20;
                            const customerNameHeight = 5;
                            const tableHeaderHeight = 10;
                            const rowHeight = 7;
                            const estimatedHeight = customerNameHeight + tableHeaderHeight + (tableRows.length * rowHeight);
                            
                            let newStartY = doc.autoTable.previous.finalY + 15;

                            if ((newStartY + estimatedHeight) > (pageHeight - marginBottom)) {
                                doc.addPage();
                                newStartY = 30;
                                doc.text(`Report for Date: ${date}`, 10, 15);
                            }
                            startY = newStartY;
                        } else {
                            doc.addPage();
                            startY = 30;
                            doc.text(`Report for Date: ${date}`, 10, 15);
                        }
                    }

                    if (combineCustomers) {
                        doc.text(`Customer: ${record.name}`, 10, startY - 5);
                    } else {
                        doc.text(`Customer Report: ${record.name} - ${record.date}`, 10, startY - 10);
                    }

                    doc.autoTable(tableColumn, tableRows, { startY: startY });
                }
            });
        });

        let fileName;
        if (sortedDates.length === 1) {
            fileName = `${sortedDates[0]}.pdf`;
        } else if (sortedDates.length > 1) {
            fileName = 'multi-date-report.pdf';
        } else {
            fileName = 'selected_reports.pdf';
        }
        doc.save(fileName);
    };

    const clearAll = () => {
        if (confirm('Are you sure you want to clear all saved reports? This action cannot be undone.')) {
            // Filter out keys that start with 'e63se3ar8a_'
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('e63se3ar8a_')) {
                    localStorage.removeItem(key);
                }
            });
            // Also remove the last saved record indicator
            localStorage.removeItem('last_saved_record');
            console.log('All e63se3ar8a_ prefixed items and last_saved_record removed from localStorage.');
            loadRecords(); // Reload the list of records, which should now be empty
            reportContent.innerHTML = '<p>Select a record from the list to view details.</p>';
            alert('All saved reports have been cleared.');
        }
    };

    // Event Listeners
    recordList.addEventListener('click', (e) => {
        const customerEntry = e.target.closest('.customer-entry');
        const dateHeader = e.target.closest('.date-header');

        if (customerEntry && e.target.type !== 'checkbox') {
            document.querySelectorAll('.customer-entry').forEach(el => el.classList.remove('selected'));
            customerEntry.classList.add('selected');
            displayRecord(customerEntry.dataset.name, customerEntry.dataset.date);
        } else if (dateHeader) {
            dateHeader.nextElementSibling.classList.toggle('visible');
            const checkbox = dateHeader.querySelector('.date-checkbox');
            if (e.target.tagName !== 'INPUT') {
                // If the click was not on the checkbox itself, toggle its state
                // This part is tricky because of the event propagation.
                // A simpler approach is to let the label do its job, but we don't have one.
            }
        }
        
        if (e.target.classList.contains('date-checkbox')) {
            const date = e.target.dataset.date;
            const isChecked = e.target.checked;
            e.target.closest('.date-group').querySelectorAll('.record-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        }
    });

    searchBar.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        document.querySelectorAll('.date-group').forEach(group => {
            const date = group.querySelector('.date-header span').textContent.toLowerCase();
            const customerEntries = Array.from(group.querySelectorAll('.customer-entry'));
            const customers = customerEntries.map(c => c.querySelector('.record-name').textContent.toLowerCase());
            
            const isDateMatch = date.includes(filter);
            const isCustomerMatch = customers.some(c => c.includes(filter));

            if (isDateMatch || isCustomerMatch) {
                group.style.display = '';
                // If date matches, show all customers under it. If only customer matches, show only that customer.
                customerEntries.forEach(entry => {
                    const customerName = entry.querySelector('.record-name').textContent.toLowerCase();
                    if (isDateMatch || customerName.includes(filter)) {
                        entry.style.display = '';
                    } else {
                        entry.style.display = 'none';
                    }
                });
            } else {
                group.style.display = 'none';
            }
        });
    });

    datePicker.addEventListener('change', (e) => {
        loadRecords(e.target.value);
    });

    downloadPdfBtn.addEventListener('click', generatePdf);
    deleteRecordBtn.addEventListener('click', deleteRecord);
    editAgainBtn.addEventListener('click', editAgain);
    downloadAllBtn.addEventListener('click', downloadAll);
    clearAllBtn.addEventListener('click', clearAll);

    // Initial Load
    loadRecords();
});