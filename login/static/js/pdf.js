function getpdf_data() {
    const account = document.getElementById("accountSelect").value;
    const period = document.getElementById("periodSelect").value;
    const format = document.getElementById("formatSelect").value;

    // if (!account || account === "- Select An Account -") {
    //     alert("Please Select Account Type.");
    //     return;
    // }

    // if (!period || period === "no") {
    //     alert("Please Select Period.");
    //     return;
    // }

    // if (!format || format === "no") {
    //     alert("Please Select Format.");
    //     return;
    // }


    $.ajax({
        url: '/get-updated-report/',
        method: 'POST',
        data: {

            'username': userData.username,
            'userid': userData.userID,
            'csrfmiddlewaretoken': '{{ csrf_token }}'
        },
        success: function (response) {
            // alert("sfdbfdsb");
            console.log("Report response:", response);
            if (response.from_date && response.to_date) {
                if (response.from_date && response.to_date) {
                    // const dateRangeText = `From: ${response.from_date} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;To: ${response.to_date}`;
                    // document.getElementById("date-range-display").innerHTML = dateRangeText;
                }
            }
            console.log('user name full name', response.user.full_name)

            $('#user_full_name').text('MS. ' + response.user.full_name);
            $('#user_address_line1').text(response.user.street);
            $('#user_address_line2').text(response.user.landmark);
            $('#user_city_pincode').text((response.user.city + ' ' + response.user.pincode));
            $('#user_state_country').text((response.user.state + ' ' + response.user.country));
            $('#user_joint_holders').text('JOINT HOLDERS: ' + response.user.joint_holders);
            console.log('nominee----', response.user.nominee)
            $('#nominee').text('Nomination: ' + response.account_info.nomination);





            $('#account_branch').html(response.branch.branch_name);
            $('#branch_address').html(response.branch.branch_address);
            $('#branch_city').html(response.branch.city);
            $('#branch_state').html(response.branch.state);
            $('#branch_code').html(response.branch.branch_code);
            $('#requestingBranch').html(response.branch.branch_code);

            $('#ifsc_micr').html(response.branch.rtgs_neft_ifsc);
            $('#email').html(response.user.email);
            $('#branch_phone').html(response.user.mobile_number);

            $('#od_limit').html(response.account_info.od_limit);
            $('#currency').html(response.account_info.currency);

            $('#cust_id').html(response.account_info.user_id);
            $('#account_no').html(response.account_info.account_no);
            $('#ac_open_date').html(response.account_info.ac_open_date);
            $('#ac_status').html(
                response.account_info.ac_status.charAt(0) + response.account_info.ac_status.slice(1).toLowerCase()
            );


            $('#account_type').html(response.account_info.account_type);


            $('#withdrawal_count').html(response.withdrawal_count);
            $('#deposit_count').html(response.deposit_count);
            $('#no_of_withdrawal').html(response.no_of_withdrawal);
            $('#no_of_total_deposit').html(response.no_of_total_deposit);






            // Show the result table or other content
            document.getElementById("fetch_report").style.display = "table";

            // const formatDate = (dateStr) => {
            //     const date = new Date(dateStr);
            //     return date.toLocaleDateString('en-GB', {
            //         day: '2-digit',
            //         month: 'short',
            //         year: 'numeric'
            //     });
            // };

            // const formatPDFDate = (dateStr) => {
            //     const d = new Date(dateStr);
            //     const dd = String(d.getDate()).padStart(2, '0');
            //     const mm = String(d.getMonth() + 1).padStart(2, '0');
            //     const yy = String(d.getFullYear()).slice(-2);
            //     return `${dd}/${mm}/${yy}`;
            // };


            const pdfStatementTable = document.getElementById("pdf_statement");
            console.log('inside the pdf statement line')
            // Clear both tables except their headers


            const pdfTbody = pdfStatementTable.querySelector("tbody");
            pdfTbody.innerHTML = ''; // Clear all existing rows

            if (response.status === 'success' && response.data.length > 0) {
                response.data.forEach(txn => {
                    // ========== Append to fetch_report ==========
                    const row = document.createElement('tr');
                    row.className = 'account_statements';
                    // ========== Append to pdf_statement ==========
                    const pdfRow = document.createElement('tr');
                    pdfRow.innerHTML = `
                        <td>${txn.txn_date}</td>
                        <td>${txn.narration}</td>
                        <td>${txn.ref_no}</td>
                        <td>${txn.value_date}</td>
                        <td>${txn.withdrawal_amt ? txn.withdrawal_amt.toLocaleString() : ''}</td>
                        <td>${txn.deposit_amt ? txn.deposit_amt.toLocaleString() : ''}</td>
                        <td>${txn.running_balance ? txn.running_balance.toLocaleString() : ''}</td>
                    `;
                    pdfTbody.appendChild(pdfRow);
                });
                download_pdf(response)



            } else {
                alert("No transactions found for the selected date range.");
            }
        },
        error: function (xhr) {
            console.error("Error:", xhr.responseText);
            alert("Failed to fetch report.");
        }
    });
}

function download_pdf(response) {
    console.log('response---->', response.account_info.od_limit)

    var od_lim = response.account_info.od_limit;
    // alert("test")
    const element = document.getElementById('pdf-content');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'hdfc_statement.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: 0,
            width: element.scrollWidth,
            height: element.scrollHeight
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all'] }
    };

    html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(function (pdf) {
            const totalPages = pdf.internal.getNumberOfPages();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const headerLogo = "data:image/png;base64,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";

            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);


                  // ✅ Draw a box border on each page
    // const boxMarginLeft = 20;  // left margin
    // const boxMarginTop = 227;  // start after header (same as your topBorderY)
    // const boxWidth = pageWidth - 40; // leave 20px margin on each side
    // const boxHeight = pageHeight - 307; // page height minus header & footer areas

    // pdf.setDrawColor(102, 102, 102);  // grey border
    // pdf.setLineWidth(0.75);
    // pdf.rect(boxMarginLeft, boxMarginTop, boxWidth, boxHeight);
                // Add consistent header styling
                try {
                    pdf.addImage(headerLogo, "PNG", 20, 15, 120, 15);
                } catch (e) {
                    console.warn("Header logo failed to load:", e);
                }

                // Page number and header text styling
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(9);
                pdf.setTextColor(0, 0, 0);
                const pageText = `Page ${i} of ${totalPages}`;
                const textWidth = pdf.getTextWidth(pageText);
                pdf.text(pageText, (pageWidth - textWidth) / 2, 35);

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(10);
                const headerText = "Account Statement";
                const headerWidth = pdf.getTextWidth(headerText);
                pdf.text(headerText, pageWidth - headerWidth - 20, 25);

                /* --- Additional Header Content --- */
                let headerY = 55 + 40;       // inside 60mm reserved header
                let headerRightY = 60;

                // 👉 Left Block (with aligned colons)
                const leftLabelX = 30;
                const leftColonX = leftLabelX + 70;
                const leftValueX = leftColonX + 5;

                pdf.setFont("times", "normal");
                pdf.setFontSize(9);

                function printLeftRow(label, value, y) {
                    pdf.text(label, leftLabelX, y);
                    pdf.text(":", leftColonX, y);
                    if (value) pdf.text(value, leftValueX, y);
                }




                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(9);
                pdf.setTextColor(0, 0, 0);

                // starting position
                let blockX = 30;
                let blockY = headerY;
                let lineHeight = 12;

                // collect all lines
                let lines = [
                    { text: (response.user.full_name || "").toUpperCase() },
                    { text: (response.user.street || "").toUpperCase() },
                    { text: (response.user.landmark || "").toUpperCase() },
                    { text: ((response.user.city || "") + ' ' + (response.user.pincode || "")).toUpperCase() },
                    { text: (response.user.state || "").toUpperCase() },
                    { text: (response.user.country || "").toUpperCase() },
                    { text: "" },
                    { text: "JOINT HOLDERS: " + (response.user.joint_holders || "").toUpperCase() }
                ];


                // calculate block dimensions
                let blockWidth = 250; // adjust as needed
                let blockHeight = lines.length * lineHeight + 10; // +10 for padding

                // draw clean rectangle around customer details
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(0.5);
                pdf.rect(blockX - 5, blockY - 10, blockWidth, blockHeight);

                // print customer details with consistent formatting
                let currentY = blockY;
                lines.forEach((line, index) => {
                    if (index === 0) {
                        pdf.setFont("helvetica", "bold");
                        pdf.setFontSize(10);
                    } else {
                        pdf.setFont("helvetica", "normal");
                        pdf.setFontSize(9);
                    }
                    pdf.text(line.text, blockX, currentY);
                    currentY += lineHeight;
                });

                currentY += 12;
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);
                pdf.text("Nomination: Registered", 30, currentY);

                currentY += 15;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(10);
                pdf.text("Statement Period: 01/04/2024 to 31/03/2025", 30, currentY);


                // 👉 Right Block (with aligned colons)
                const rightLabelX = pageWidth - 280;
                const rightColonX = rightLabelX + 80;
                const rightValueX = rightColonX + 5;

                function printRightRow(label, value, y) {
                    pdf.setFont("helvetica", "normal");
                    pdf.setFontSize(8);
                    pdf.text(label, rightLabelX, y);
                    pdf.text(":", rightColonX, y);
                    if (value) {
                        pdf.setFont("helvetica", "normal");
                        pdf.text(String(value), rightValueX, y);
                    }
                }

                // Draw top and bottom borders for each page (adjust as necessary)
                const topBorderY = 227;  // Adjust based on your content's layout
                const bottomBorderY = pageHeight - 80; // Adjust based on your footer's position

                pdf.setDrawColor(102, 102, 102);
              

                pdf.setLineWidth(0.78);


                // if (i != 1 && i != totalPages) {
                //     pdf.line(20.5, topBorderY, pageWidth - 30.5, topBorderY);
                // }
                // if (i != totalPages && i != totalPages - 1) {
                //     pdf.line(20.5, bottomBorderY, pageWidth - 30.5, bottomBorderY);

                //     // ✅ Extend vertical lines till background ends
                // const columnsX = [20.7, 61.69, 298.9, 387.3,429.3,494,543.8, pageWidth - 30.6];
                // columnsX.forEach(x => {
                //     pdf.line(x, topBorderY+20, x, bottomBorderY);
                // });
                // }
                






                printRightRow("Account Branch", (response.branch.branch_name || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Address", (response.branch.branch_address || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("City", (response.branch.city || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("State", (response.branch.state || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Phone no.", (response.user.mobile_number || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("OD Limit", (response.account_info.od_limit.toString() || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Currency", (response.account_info.currency || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Email", (response.user.email || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Cust ID", (response.account_info.user_id.toString() || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Account No", (response.account_info.account_no || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("A/C Open Date", (response.account_info.ac_open_date || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Account Status", (response.account_info.ac_status || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("IFSC", (response.branch.rtgs_neft_ifsc || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("MICR", "600240053", headerRightY);  // already fixed value
                headerRightY += 9;
                printRightRow("Branch Code", (response.branch.branch_code || "").toUpperCase(), headerRightY);
                headerRightY += 9;
                printRightRow("Account Type", response.account_info.account_type || "", headerRightY); // ✅ keep original case


                // Footer section with improved styling
                const leftMargin = 20;
                let footerY = pageHeight - 60;

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(10);
                pdf.setTextColor(0, 102, 204);
                pdf.text("HDFC BANK LIMITED", leftMargin, footerY);

                footerY += 10;
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7);
                pdf.setTextColor(0, 102, 204);
                pdf.text("*Closing balance includes funds earmarked for hold and uncleared funds", leftMargin, footerY);

                footerY += 10;
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(7);
                const disclaimerText = "Contents of this statement will be considered correct if no error is reported within 30 days of receipt of statement. The address on this statement is that on record with the Bank as at the day of requesting this statement.";
                const splitText = pdf.splitTextToSize(disclaimerText, pageWidth - 40);
                pdf.text(splitText, leftMargin, footerY);

                footerY += 15;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(7);
                pdf.text("State account branch GSTIN: 33AAACH2702H1Z7", leftMargin, footerY);

                footerY += 8;
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(0, 0, 0);
                pdf.text("HDFC Bank GSTIN details are available at", leftMargin, footerY);

                pdf.setTextColor(0, 0, 255);
                const linkText = "HDFC GST Portal";
                const linkX = leftMargin + 158;
                const linkY = footerY;

                pdf.textWithLink(linkText, linkX, linkY, {
                    url: "https://www.hdfcbank.com/personal/making-payments/online-tax-payment/goods-and-service-tax"
                });

                const linkWidth = pdf.getTextWidth(linkText);
                pdf.setDrawColor(0, 0, 255);
                pdf.setLineWidth(0.2);
                pdf.line(linkX, linkY + 1, linkX + linkWidth, linkY + 1);

                footerY += 8;
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(7);
                const addressText = "Registered Office Address: HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai 400013";
                const splitAddress = pdf.splitTextToSize(addressText, pageWidth - 40);
                pdf.text(splitAddress, leftMargin, footerY);
            }
        })
        .save();
}

function generateMonthOptions() {
    const select = document.getElementById("periodSelect");
    const today = new Date();

    // Add Current Month
    const currentMonthName = today.toLocaleString("default", { month: "long" });
    const currentYear = today.getFullYear();
    const currentValue = currentMonthName.substring(0, 3).toUpperCase() + currentYear;
    select.add(new Option(`Current Month (${currentMonthName} ${currentYear})`, currentValue));

    // Add Last 5 Months
    for (let i = 1; i <= 5; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString("default", { month: "long" });
        const year = d.getFullYear();
        const value = monthName.substring(0, 3).toUpperCase() + year;
        if (i === 1) {
            select.add(new Option(`Last Month (${monthName} ${year})`, value));
        } else {
            select.add(new Option(`${monthName} ${year}`, value));
        }
    }

    // Add static options
    select.add(new Option("Previous Financial Year", "PREV_FIN_YEAR"));
    select.add(new Option("Select Date Range", "DATE_RANGE"));

    // Hide specific rows initially
    const row1 = document.getElementById("specificRow1");
    const row2 = document.getElementById("specificRow2");
    const frmDate = document.getElementById("frmDatePicker");
    const toDate = document.getElementById("toDatePicker");

    row1.style.display = "none";
    row2.style.display = "none";
    frmDate.disabled = true;
    toDate.disabled = true;

    // Show/hide rows on selection
    select.addEventListener("change", function () {
        if (select.value === "DATE_RANGE") {
            row1.style.display = "";
            row2.style.display = "";
            frmDate.disabled = false;
            toDate.disabled = false;
        } else {
            row1.style.display = "none";
            row2.style.display = "none";
            frmDate.disabled = true;
            toDate.disabled = true;
        }
    });
}

// Call function
document.addEventListener("DOMContentLoaded", generateMonthOptions);


$(function () {
    // Initialize the datepicker on the input
    $("#frmDatePickerPDF").datepicker({
        changeMonth: false,
        changeYear: false,
        showAnim: "slideDown",
        dateFormat: "dd-mm-yy"
    });

    // Trigger the datepicker when clicking the image
    $("#dateTriggerPDF").click(function () {
        $("#frmDatePickerPDF").datepicker("show");
    });
});

$(function () {
    $("#toDatePickerPDF").datepicker({
        changeMonth: false,
        changeYear: false,
        showAnim: "slideDown",
        dateFormat: "dd-mm-yy"
    });

    // Trigger the datepicker when clicking the image
    $("#datetoTriggerPDF").click(function () {
        $("#toDatePickerPDF").datepicker("show");
    });
});
